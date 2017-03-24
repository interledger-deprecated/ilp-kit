"use strict"

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

// TODO exception handling
module.exports = class SPSP {
  static constitute () { return [Config, PaymentFactory, Socket, Ledger, Utils] }
  constructor (config, Payment, socket, ledger, utils) {
    this.Payment = Payment
    this.socket = socket
    this.config = config
    this.ledger = ledger
    this.prefix = config.data.getIn(['ledger', 'prefix'])
    this.utils = utils

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

  /**
   * Sender
   */

  // Get or create a sender instance
  /** getSender (user) {
    yield this.connect()

    if (!this.senders[user.username]) {
      this.senders[user.username] = {
        instance: ILP.createSender(yield this.factory.create({ username: user.username }))
      }

      debug('created a sender object')
    }

    // Destroy the sender if it hasn't been used for 15 seconds
    this.scheduleSenderDestroy(user.username)

    return this.senders[user.username].instance
  }

  // Destroy the sender
  scheduleSenderDestroy (username) {
    const self = this
    const sender = self.senders[username]

    if (!sender) return

    // Keep the listeners alive for 15 more seconds
    clearTimeout(sender.timeout)
    sender.timeout = setTimeout(co.wrap(function *() {
      // TODO destroy the plugin
      yield sender.instance.stopListening()

      delete self.senders[username]

      debug('destroyed the sender object')
    }), 15000)
  }*/



  * quote (params) {
    return ILP.SPSP.quote(
      yield this.factory.create({ username: params.source.username }),
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
    return ILP.SPSP.sendPayment(yield this.factory.create({ username }), payment)
  }

  /**
   * Receiver
   */
  // Get a receiver instance
  /** getReceiver (user) {
    const self = this

    yield self.connect()

    if (!this.receivers[user.username]) {
      const instance = ILP.createReceiver(yield this.factory.create({ username: user.username }))

      yield instance.listen()

      // Handle incoming payments
      // TODO remove the listener?
      instance.on('incoming', co.wrap(function *(transfer) {
        debug('incoming payment', transfer)

        const payment = yield self.Payment.createOrUpdate({
          execution_condition: transfer.executionCondition,
          transfer: transfer.id,
          state: 'success'
        })

        yield this.activity.processPayment(payment, user)
      }))

      // Add the receiver to the list
      this.receivers[user.username] = {
        instance
      }

      debug('created a receiver object')
    }

    // Destroy the receiver if it hasn't been used for 15 seconds
    self.scheduleReceiverDestroy(user.username)

    return this.receivers[user.username].instance
  }

  // Destroy the receiver object
  scheduleReceiverDestroy (username) {
    const self = this
    const receiver = self.receivers[username]

    if (!receiver) return

    // Keep the listeners alive for 15 seconds
    clearTimeout(receiver.timeout)

    receiver.timeout = setTimeout(co.wrap(function *() {
      // TODO destroy the plugin
      yield receiver.instance.stopListening()

      delete self.receivers[username]

      debug('destroyed the receiver object')
    }), 15000)
  }*/

  * query (username) {
    const destinationAccount = this.prefix + username
    const receiverSecret = this.config.generateSecret(destinationAccount)

    const receiver = yield this.factory.create({ username })

    const psk = ILP.PSK.generateParams({
      destinationAccount,
      receiverSecret
    })
    const ledgerInfo = yield this.ledger.getInfo()

    const stopListening = yield ILP.PSK.listen(receiver, { receiverSecret }, params => {
      // TODO:BEFORE_DEPLOY uncomment
      // stopListening()
      return params.fulfill()
    })

    return {
      destination_account: destinationAccount,
      shared_secret: psk.sharedSecret,
      maximum_destination_amount: '10000000000000000000000000',
      minimum_destination_amount: '0.001',
      ledger_info: {
        currency_code: ledgerInfo.currency_code,
        currency_symbol: ledgerInfo.currency_symbol,
        precision: ledgerInfo.precision,
        scale: ledgerInfo.scale
      },
      receiver_info: {
         // TODO:BEFORE_DEPLOY fill
      }
    }
  }
}
