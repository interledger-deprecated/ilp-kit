"use strict"

const co = require('co')
const uuid = require ('uuid4')
const superagent = require('superagent-promise')(require('superagent'), Promise)

const ILP = require('ilp')
const FiveBellsLedgerPlugin = require('ilp-plugin-bells')

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

    this.ledgerPrefix = this.config.data.getIn(['ledger', 'prefix'])
    this.ledgerPublicUri = this.config.data.getIn(['ledger', 'public_uri'])

    this.adminName = this.config.data.getIn(['ledger', 'admin', 'name'])
    this.adminPass = this.config.data.getIn(['ledger', 'admin', 'pass'])
  }

  /**
   * Sender
   */
  * quote(params) {
    const sourceAccount = this.ledgerPublicUri + '/accounts/' + params.source.username

    this.sender = ILP.createSender({
      _plugin: FiveBellsLedgerPlugin,
      prefix: this.ledgerPrefix,
      account: sourceAccount,
      username: this.adminName,
      password: this.adminPass
    })

    // One of the amounts should be supplied to get a quote for the other one
    const sourceAmount = params.sourceAmount || (
      yield this.sender.quoteDestinationAmount(
        params.destination.ilpAddress,
        params.destinationAmount))
    const destinationAmount = params.destinationAmount || (
      yield this.sender.quoteSourceAmount(
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
      memo: options.memo
    })).body
  }

  * pay(params) {
    const quote = yield this.setup({
      paymentUri: params.destination.paymentUri,
      amount: params.destinationAmount,
      sender_identifier: params.source.username,
      memo: params.memo
    })

    const paymentParams = yield this.sender.quoteRequest(quote)

    // Sometimes 'paymentParams' comes with a (slightly) different sourceAmount
    paymentParams.sourceAmount = params.sourceAmount
    paymentParams.uuid = uuid()

    // TODO any rounding stuff here?
    // Make sure the deliverable amount is what the user agreed with
    if (parseFloat(paymentParams.destinationAmount) !== parseFloat(params.destinationAmount)) {
      // TODO handle
      return
    }

    yield this.sender.payRequest(paymentParams)

    return paymentParams
  }

  /**
   * Receiver
   */
  * createRequest(destinationUser, destinationAmount) {
    const self = this
    const prefix = self.config.data.getIn(['ledger', 'prefix'])
    const destinationAccount = self.config.data.getIn(['ledger', 'public_uri'])
      + '/accounts/' + destinationUser.username

    self.receiver = ILP.createReceiver({
      _plugin: FiveBellsLedgerPlugin,
      prefix: prefix,
      account: destinationAccount,
      username: self.adminName,
      password: self.adminPass
    })

    yield self.receiver.listen()

    self.receiver.on('incoming', co.wrap(function *(transfer) {
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
      self.socket.payment(destinationUser.username, dbPayment)

      self.receiver.stopListening()
    }))

    return this.receiver.createRequest({
      amount: destinationAmount
    })
  }
}
