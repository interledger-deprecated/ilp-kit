"use strict"

const _ = require('lodash')
const co = require('co')
const uuid = require ('uuid4')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const Container = require('constitute').Container
const sender = require('five-bells-sender')

const PaymentFactory = require('../models/payment')
const UserFactory = require('../models/user')

const Config = require('./config')
const Log = require('./log')

const ILP = require('ilp')
const FiveBellsLedgerPlugin = require('ilp-plugin-bells')

// TODO exception handling
module.exports = class SPSP {
  static constitute() { return [Config, Log, Container, PaymentFactory] }
  constructor(config, log, container, Payment) {
    this.Payment = Payment
  }

  * init() {
    /*
    this.receiver.on('incoming', (transfer, fulfillment) => {
      console.log('received transfer:', transfer)
      console.log('fulfilled transfer hold with fulfillment:', fulfillment)
    })*/
  }

  /**
   * Sender
   */
  * getReceiver(options) {
    const response = yield superagent.get(options.paymentUri, {
      amount: options.amount
    })

    return response.body
  }

  * setup(options) {
    const response = yield superagent.post(options.paymentUri, {
      amount: options.amount,
      sender_identifier: options.sender_identifier,
      memo: options.memo
    })

    return response.body
  }

  // The quoting has different flows depending on what's supplied (source or destination amount)
  * quote(params) {
    this.sender = ILP.createSender({
      _plugin: FiveBellsLedgerPlugin,
      prefix: 'wallet1.', // TODO:BEFORE_DEPLOY don't hardcode
      account: 'http://wallet1.com/ledger/accounts/alice',
      password: 'alice'
    })

    // TODO remove hardcode
    const sourceAmount = params.sourceAmount || (yield this.sender.quoteDestinationAmount('wallet2.alice', params.destinationAmount))
    const destinationAmount = params.destinationAmount || (yield this.sender.quoteSourceAmount('wallet2.alice', params.sourceAmount))

    return {
      sourceAmount,
      destinationAmount
    }
  }

  * pay(params) {
    const quote = yield this.setup({
      paymentUri: params.destination.paymentUri,
      amount: params.destinationAmount,
      sender_identifier: 'alice@wallet1.com', // TODO remove hardcode,
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

    return paymentParams.uuid
  }

  /**
   * Receiver
   */
  * createRequest(amount) {
    const self = this

    self.receiver = ILP.createReceiver({
      _plugin: FiveBellsLedgerPlugin,
      prefix: 'wallet2.',
      account: 'http://wallet2.com/ledger/accounts/alice',
      password: 'alice'
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
      dbPayment.save()
    }))

    return this.receiver.createRequest({
      amount: amount
    })
  }
}
