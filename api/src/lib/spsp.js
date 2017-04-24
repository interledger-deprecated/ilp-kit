'use strict'

const superagent = require('superagent-promise')(require('superagent'), Promise)
const debug = require('debug')('ilp-kit:spsp')

const ILP = require('ilp')
const PluginBellsFactory = require('ilp-plugin-bells').Factory

const PaymentFactory = require('../models/payment')
const Config = require('./config')
const Socket = require('./socket')
const Ledger = require('./ledger')
const Utils = require('./utils')
const Activity = require('./activity')
const uuid = require('uuid')

// TODO exception handling
module.exports = class SPSP {
  constructor (deps) {
    this.Payment = deps(PaymentFactory)
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
      adminAccount: this.config.data.getIn(['ledger', 'public_uri']) + '/accounts/' + adminUsername
    })

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
    return ILP.SPSP.quote(
      await this.factory.create({ username: params.user.username }),
      {
        receiver: params.destination,
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
    return ILP.SPSP.sendPayment(await this.factory.create({ username }),
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
              // TODO:BEFORE_DEPLOY source_identifier
              // source_identifier: user.identifier,
              // TODO source_amount ?
              // source_amount: parseFloat(params.transfer.sourceAmount),
            destination_user: user.id,
            destination_identifier: user.identifier,
            destination_amount: parseFloat(params.transfer.amount) * Math.pow(10, -ledgerInfo.scale),
              // destination_name: destination.name,
              // destination_image_url: destination.imageUrl,
            transfer: params.transfer.id,
              // TODO:BEFORE_DEPLOY message
              // message: opts.message || null,
            execution_condition: params.transfer.executionCondition,
            state: 'success'
          })

          await self.activity.processPayment(payment, user)

          return params.fulfill()
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
         // TODO:BEFORE_DEPLOY fill
      }
    }
  }
}
