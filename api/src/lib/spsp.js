"use strict"

const co = require('co')
const uuid = require('uuid4')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const debug = require('debug')('ilp-kit:spsp')

const ILP = require('ilp')
const PluginBellsFactory = require('ilp-plugin-bells').Factory

const PaymentFactory = require('../models/payment')
const Config = require('./config')
const Socket = require('./socket')

// TODO exception handling
module.exports = class SPSP {
  static constitute() { return [Config, PaymentFactory, Socket] }
  constructor(config, Payment, socket) {
    this.Payment = Payment
    this.socket = socket
    this.config = config

    this.senders = {}
    this.receivers = {}

    this.factory = new PluginBellsFactory({
      adminUsername: this.config.data.getIn(['ledger', 'admin', 'name']),
      adminPassword: this.config.data.getIn(['ledger', 'admin', 'pass']),
      adminAccount: this.config.data.getIn(['ledger', 'public_uri']) + '/accounts/admin'
    })

    // TODO figure out a better solution
    // Waiting for the ledger to start
    setTimeout(() => {
      this.factory.connect()
        .catch((err) => {
          console.log('spsp:34', err)
        })
    }, 10000)

  }

  /**
   * Sender
   */

  // Get or create a sender instance
  * getSender(username) {
    if (!this.senders[username]) {
      this.senders[username] = {
        instance: ILP.createSender(yield this.factory.create({ username }))
      }

      debug('created a sender object')
    }

    // Destroy the sender if it hasn't been used for 15 seconds
    this.scheduleSenderDestroy(username)

    return this.senders[username].instance
  }

  // Destroy the sender
  scheduleSenderDestroy(username) {
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
  }

  * quote(params) {
    const username = params.source.username
    const sender = yield this.getSender(username)

    // One of the amounts should be supplied to get a quote for the other one
    const sourceAmount = params.sourceAmount || (
      yield sender.quoteDestinationAmount(
        params.destination.ilpAddress,
        params.destinationAmount))

    const destinationAmount = params.destinationAmount || (
      yield sender.quoteSourceAmount(
        params.destination.ilpAddress,
        params.sourceAmount))

    return {
      sourceAmount,
      destinationAmount
    }
  }

  * setup(options) {
    return (yield superagent.post(options.paymentUri, {
      amount: options.amount,
      sender_identifier: options.sender_identifier,
      sender_name: options.sender_name,
      sender_image_url: options.sender_image_url,
      memo: options.memo
    })).body
  }

  * pay(params) {
    const sender = yield this.getSender(params.source.username)

    const quote = yield this.setup({
      paymentUri: params.destination.paymentUri,
      amount: params.destinationAmount,
      sender_identifier: params.source.username,
      sender_name: params.source.name,
      sender_image_url: params.source.profile_picture,
      memo: params.memo
    })

    const paymentParams = yield sender.quoteRequest(quote)

    // Sometimes 'paymentParams' comes with a (slightly) different sourceAmount.
    // TODO Need to make sure it's not too different
    // paymentParams.sourceAmount = params.sourceAmount
    paymentParams.uuid = uuid()

    // TODO any rounding stuff here?
    // Make sure the deliverable amount is what the user agreed with
    if (parseFloat(paymentParams.destinationAmount) !== parseFloat(params.destinationAmount)) {
      // TODO handle
      return
    }

    yield sender.payRequest(paymentParams)

    return paymentParams
  }

  /**
   * Receiver
   */
  // Get a receiver instance
  * getReceiver(username) {
    const self = this

    if (!this.receivers[username]) {
      const instance = ILP.createReceiver(yield this.factory.create({ username }))

      yield instance.listen()

      // Handle incoming payments
      // TODO remove the listener?
      instance.on('incoming', co.wrap(function *(transfer) {
        debug('incoming payment', transfer)

        // Get the db payment
        const dbPayment = yield self.Payment.findOne({
          where: {
            // TODO should it really be referenced by a condition?
            execution_condition: transfer.executionCondition
          }
        })

        // Update the db payment
        dbPayment.state = 'success'
        yield dbPayment.save()

        // Notify the clients
        // TODO should probably have the same format as the payment in history
        self.socket.payment(username, dbPayment)
      }))

      // Add the receiver to the list
      this.receivers[username] = {
        instance
      }

      debug('created a receiver object')
    }

    // Destroy the receiver if it hasn't been used for 15 seconds
    self.scheduleReceiverDestroy(username)

    return this.receivers[username].instance
  }

  // Destroy the receiver object
  scheduleReceiverDestroy(username) {
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
  }

  * createRequest(destinationUser, destinationAmount) {
    const self = this
    const username = destinationUser.username

    const receiver = yield self.getReceiver(username)

    const request = receiver.createRequest({
      amount: destinationAmount
    })

    return request
  }
}
