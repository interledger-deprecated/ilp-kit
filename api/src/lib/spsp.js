'use strict'

const co = require('co')
const uuid = require('uuid4')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const BigNumber = require('bignumber.js')
const debug = require('debug')('ilp-kit:spsp')

const ILP = require('ilp')
const PluginBellsFactory = require('ilp-plugin-bells').Factory

const PaymentFactory = require('../models/payment')
const Config = require('./config')
const Socket = require('./socket')
const Ledger = require('./ledger')
const Utils = require('./utils')
const Activity = require('./activity')

// TODO exception handling
module.exports = class SPSP {
  static constitute () { return [Config, PaymentFactory, Socket, Ledger, Utils, Activity] }
  constructor (config, Payment, socket, ledger, utils, activity) {
    this.Payment = Payment
    this.socket = socket
    this.config = config
    this.ledger = ledger
    this.prefix = config.data.getIn(['ledger', 'prefix'])
    this.utils = utils
    this.activity = activity

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
  * quote (params) {
    yield this.factory.connect()
    return ILP.SPSP.quote(
      yield this.factory.create({ username: params.user.username }),
      {
        receiver: params.destination,
        sourceAmount: params.sourceAmount,
        destinationAmount: params.destinationAmount
      }
    )
  }

  * setup (options) {
    return (yield superagent.post(options.paymentUri, {
      amount: options.amount,
      source_identifier: options.source_identifier,
      sender_name: options.sender_name,
      sender_image_url: options.sender_image_url,
      memo: options.memo
    })).body
  }

  * pay (username, payment) {
    yield this.factory.connect()
    return yield ILP.SPSP.sendPayment(
      yield this.factory.create({ username }),
      Object.assign({}, payment, { id: uuid() }))
  }

  * query (user) {
    const self = this
    const destinationAccount = this.prefix + user.username
    const receiverSecret = this.config.generateSecret(destinationAccount)

    yield this.factory.connect()
    const receiver = yield this.factory.create({ username: user.username })

    const psk = ILP.PSK.generateParams({
      destinationAccount,
      receiverSecret
    })
    const ledgerInfo = yield this.ledger.getInfo()

    if (!this.listenerCache[user.username]) {
      this.listenerCache[user.username] = true
      yield ILP.PSK.listen(receiver, { receiverSecret }, co.wrap(function * (params) {
        try {
            // Store the payment in the wallet db
          const payment = yield self.Payment.createOrUpdate({
              // TODO:BEFORE_DEPLOY source_identifier
            source_identifier: params.headers['source-identifier'],
              // TODO source_amount ?
              // source_amount: parseFloat(params.transfer.sourceAmount),
            destination_user: user.id,
            destination_identifier: user.identifier,
            destination_amount: parseFloat(params.transfer.amount) * Math.pow(10, -ledgerInfo.scale),
              // destination_name: destination.name,
              // destination_image_url: destination.imageUrl,
            transfer: params.transfer.id,
              // TODO:BEFORE_DEPLOY message
            message: params.headers.message || null,
            execution_condition: params.transfer.executionCondition,
            state: 'success'
          })

          yield self.activity.processPayment(payment, user)

          return params.fulfill()
        } catch (e) {
          debug('Error fulfilling SPSP payment', e)
          throw e
        }
      }))
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
