'use strict'

const superagent = require('superagent')
const debug = require('debug')('ilp-kit:spsp')
const uuid = require('uuid4')

const ILP = require('ilp')
const PluginVirtual = require('ilp-plugin-virtual')

const PaymentFactory = require('../models/payment')
const Config = require('./config')
const Socket = require('./socket')
const Ledger = require('./ledger')
const Utils = require('./utils')
const Token = require('./token')
const Activity = require('./activity')

// TODO exception handling
module.exports = class SPSP {
  constructor (deps) {
    this.Payment = deps(PaymentFactory)
    this.socket = deps(Socket)
    this.config = deps(Config)
    this.ledger = deps(Ledger)
    this.token = deps(Token)
    this.prefix = this.config.data.getIn(['ledger', 'prefix'])
    this.utils = deps(Utils)
    this.activity = deps(Activity)

    this.senders = {}
    this.receivers = {}

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

  async getClientPlugin (username) {
    const prefix = this.prefix + username + '.'
    const clientPlugin = new PluginVirtual({
      prefix,
      token: this.token.get(prefix, Infinity),
      rpcUri: this.config.data.getIn(['server', 'base_uri']) + '/peers/rpc'
    })

    await clientPlugin.connect()
    return clientPlugin
  }

  async clientRpc (ctx) {
    const prefix = ctx.query.prefix
    const method = ctx.query.method
    const params = ctx.body

    if (!prefix) throw new InvalidBodyError('Prefix is not supplied')
    if (!method) throw new InvalidBodyError('Method is not supplied')

    const auth = ctx.request.headers.authorization || ''
    const plugin = this.listenerCache[prefix]
    if (!plugin) {
      ctx.statusCode = 404
      ctx.body = 'no cached listener with prefix "' + prefix + '"'
      return
    }

    const [ , authToken ] = auth.match(/^Bearer (.+)$/) || []
    if (!authToken || !plugin || !this.token.isValid(prefix, authToken)) {
      ctx.status = 401
      ctx.body = 'unauthorized bearer token'
      return
    }

    try {
      ctx.body = await plugin.receive(method, params)
    } catch (e) {
      ctx.statusCode = 422
      ctx.body = e.message
      log.err('client.rpc() failed: ', e.stack)
    }
  }

  // params should contain:
  // .user.username
  // .destination
  // .sourceAmount XOR .destinationAmount
  async quote (params) {
    // save a webfinger call if it's on the same domain
    const receiver = this.utils.resolveSpspIdentifier(params.destination)
    debug('making SPSP quote to', receiver)

    const clientPlugin = await this.getClientPlugin(params.user.username)
    return ILP.SPSP.quote(
      clientPlugin,
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
    const clientPlugin = await this.getClientPlugin(username)
    return ILP.SPSP.sendPayment(
      clientPlugin,
      Object.assign({}, payment, { id: uuid() }))
  }

  async query (user) {
    const self = this
    const destinationAccount = this.prefix + user.username
    const receiverSecret = this.config.generateSecret(destinationAccount)

    const receiver = await this.getClientPlugin(user.username)

    const psk = ILP.PSK.generateParams({
      destinationAccount,
      receiverSecret
    })
    const ledgerInfo = await this.ledger.getInfo()

    if (!this.listenerCache[receiver.getInfo().prefix]) {
      this.listenerCache[receiver.getInfo().prefix] = receiver
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
        image_url: this.utils.userToImageUrl(user),
        identifier: user.identifier
      }
    }
  }
}
