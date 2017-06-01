'use strict'

const superagent = require('superagent')
const crypto = require('crypto')
const base64url = require('base64url')
const debug = require('debug')('ilp-kit:spsp')
const uuid = require('uuid4')

const ILP = require('ilp')
const PluginBellsFactory = require('ilp-plugin-bells').Factory

const PaymentFactory = require('../models/payment')
const ReceiverFactory = require('../models/receiver')
const UserFactory = require('../models/user')
const Config = require('./config')
const Socket = require('./socket')
const Ledger = require('./ledger')
const Utils = require('./utils')
const Activity = require('./activity')

const SSP_CONDITION_STRING = 'ilp_ssp_condition'

function hmac (key, message) {
  const hm = crypto.createHmac('sha256', key)
  hm.update(message, 'utf8')
  return hm.digest()
}

// TODO exception handling
module.exports = class SPSP {
  constructor (deps) {
    this.Payment = deps(PaymentFactory)
    this.Receiver = deps(ReceiverFactory)
    this.User = deps(UserFactory)
    this.socket = deps(Socket)
    this.config = deps(Config)
    this.ledger = deps(Ledger)
    this.prefix = this.config.data.getIn(['ledger', 'prefix'])
    this.utils = deps(Utils)
    this.activity = deps(Activity)

    this.senders = {}
    this.receivers = {}

    const adminUsername = this.config.data.getIn(['ledger', 'admin', 'user'])
    const adminPassword = this.config.data.getIn(['ledger', 'admin', 'pass'])

    this.factory = new PluginBellsFactory({
      adminUsername: adminUsername,
      adminPassword: adminPassword,
      adminAccount: this.config.data.getIn(['ledger', 'public_uri']) + '/accounts/' + adminUsername,
      globalSubscription: true
    })

    this.factory.on('incoming_prepare', this._handleIncomingPreparedTransfer.bind(this))

    this.connect()
    this.listenerCache = {}
  }

  connect () {
    if (!this.connection) {
      this.connection = new Promise((resolve, reject) => {
        // Waiting for the ledger to start
        // TODO figure out a better solution
        setTimeout(() => this.factory.connect().then(resolve).catch(reject), 10000)
      })
    }

    return this.connection
  }

  // params should contain:
  // .user.username
  // .destination
  // .sourceAmount XOR .destinationAmount
  async quote (params) {
    await this.factory.connect()

    // save a webfinger call if it's on the same domain
    const receiver = this.utils.resolveSpspIdentifier(params.destination)
    debug('making SPSP quote to', receiver)

    return ILP.SPSP.quote(
      await this.factory.create({ username: params.user.username }),
      {
        receiver,
        sourceAmount: params.sourceAmount,
        destinationAmount: params.destinationAmount
      }
    )
  }

  async setup (options) {
    return (await superagent.post(options.paymentUri, {
      amount: options.amount,
      source_identifier: options.source_identifier,
      sender_name: options.sender_name,
      sender_image_url: options.sender_image_url,
      memo: options.memo
    })).body
  }

  async pay (username, payment) {
    await this.factory.connect()
    return ILP.SPSP.sendPayment(
      await this.factory.create({ username }),
      Object.assign({}, payment, { id: uuid() }))
  }

  async query (user) {
    const self = this
    const destinationAccount = this.prefix + user.username
    const receiverSecret = this.config.generateSecret(destinationAccount)

    await this.factory.connect()
    const receiver = await this.factory.create({ username: user.username })

    const psk = ILP.PSK.generateParams({
      destinationAccount,
      receiverSecret
    })
    const ledgerInfo = await this.ledger.getInfo()

    if (!this.listenerCache[user.username]) {
      this.listenerCache[user.username] = true
      await ILP.PSK.listen(receiver, { receiverSecret }, async function (params) {
        try {
          // Store the payment in the wallet db
          const payment = await self.Payment.createOrUpdate({
            source_identifier: params.headers['source-identifier'],
            source_name: params.headers['source-name'],
            source_image_url: params.headers['source-image-url'],
            stream_id: params.headers['stream-id'],
              // TODO source_amount ?
              // source_amount: parseFloat(params.transfer.sourceAmount),
            destination_user: user.id,
            destination_identifier: user.identifier,
            destination_amount: parseFloat(params.transfer.amount) * Math.pow(10, -ledgerInfo.scale),
            transfer: params.transfer.id,
            message: params.headers.message || null,
            execution_condition: params.transfer.executionCondition,
            state: 'success'
          })

          // Fulfill the payment
          await params.fulfill()

          // Process payment for the local database (do it in the background, no need to wait)
          self.activity.processPayment(payment, user)
        } catch (e) {
          debug('Error fulfilling SPSP payment', e)
          throw e
        }
      })
    }

    return {
      destination_account: psk.destinationAccount,
      shared_secret: psk.sharedSecret,
      maximum_destination_amount: Math.pow(2, 64).toString(),
      minimum_destination_amount: '1',
      ledger_info: {
        currency_code: ledgerInfo.currency_code,
        currency_scale: ledgerInfo.scale // See https://github.com/interledgerjs/ilp-kit/issues/284
      },
      receiver_info: {
        name: user.name,
        image_url: this.utils.userToImageUrl(user)
      }
    }

    // Destroy the receiver if it hasn't been used for 15 seconds
    self.scheduleReceiverDestroy(username)

    return this.receivers[username].instance
  }

  // Destroy the receiver object
  scheduleReceiverDestroy (username) {
    const self = this
    const receiver = self.receivers[username]

    if (!receiver) return

    // Keep the listeners alive for 15 seconds
    clearTimeout(receiver.timeout)

    receiver.timeout = setTimeout(async function () {
      // TODO destroy the plugin
      await receiver.instance.stopListening()

      delete self.receivers[username]

      debug('destroyed the receiver object')
    }, 15000)
  }

  getSharedSecretForReceiver (receiver, username) {
    const prefix = this.config.data.getIn(['ledger', 'prefix'])
    const destinationAccount = prefix + username + '.~recv.' + receiver.name
    const sharedSecret = base64url(hmac(this.config.data.get('sspSecret'), String(receiver.user) + ':' + receiver.name).slice(0, 16))

    return {
      destination_account: destinationAccount,
      shared_secret: sharedSecret
    }
  }

  async createRequest (destinationUser, destinationAmount) {
    const precisionAndScale = await this.ledger.getInfo()
    // TODO Turn all of the numbers to bignumber
    const bnAmount = new BigNumber(destinationAmount + '')
    const requiredPrecisionRounding = bnAmount.precision() - precisionAndScale.precision
    const requiredScaleRounding = bnAmount.decimalPlaces() - precisionAndScale.scale

    const roundedAmount =
      (requiredPrecisionRounding > requiredScaleRounding)
        ? bnAmount.toPrecision(precisionAndScale.precision, BigNumber.ROUND_UP)
        : bnAmount.toFixed(precisionAndScale.scale, BigNumber.ROUND_UP)

    const username = destinationUser.username

    const receiver = await this.getReceiver(username)

    const request = receiver.createRequest({
      amount: roundedAmount
    })

    return request
  }

  async _handleIncomingPreparedTransfer (account, transfer) {
    const user = await this.User.findOne({ where: { username: account }})
    const plugin = await this.factory.create({ username: account })

    const ilpHeader = transfer.data.ilp_header
    const address = ilpHeader.account
    if (address.indexOf(plugin.getAccount()) !== 0) {
      debug('received transfer with unexpected ilp address expected=%s got=%s', plugin.getAccount(), address)
      return
    }

    const localPart = address.slice(plugin.getAccount().length + 1)

    if (localPart.indexOf('~recv.') !== 0) {
      return
    }

    const [receiverName] = localPart.slice('~recv.'.length).split('.', 1)

    const receiver = await this.Receiver.findOne({ where: { user: user.id, name: receiverName } })

    if (receiver.webhook) {
      debug('sending webhook to url=%s', receiver.webhook)
      const res = await superagent
        .post(receiver.webhook)
        .send({
          transfer,
          amount: transfer.amount,
          data: ilpHeader.data
        })
        .end()

      debug('webhook completed with status=%d', res.status)

      const packet = {
        address,
        amount: transfer.amount,
        expires_at: ilpHeader.data.expires_at
      }

      const packetForSigning = stringify(packet)
      const sharedSecret = Buffer.from(this.getSharedSecretForReceiver(receiver, account).shared_secret, 'base64')
      const sspConditionKey = hmac(sharedSecret, SSP_CONDITION_STRING)
      const fulfillment = 'cf:0:' + base64url(hmac(sspConditionKey, packetForSigning))

      if (res.status === 200 && res.body.fulfill === true) {
        debug('webhook requested that the payment should be fulfilled')
        plugin.fulfillCondition(transfer.id, fulfillment)
      } else {
        debug('webhook requested that the payment be rejected')
      }
    }
  }
}
