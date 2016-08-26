"use strict"

const _ = require('lodash')
const co = require('co')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const Container = require('constitute').Container
const sender = require('five-bells-sender')
const EventEmitter = require('events').EventEmitter

const PaymentFactory = require('../models/payment')
const UserFactory = require('../models/user')

const Config = require('./config')
const Log = require('./log')

const ILP = require('ilp')
const FiveBellsLedgerPlugin = require('ilp-plugin-bells')

// TODO exception handling
module.exports = class SPSP extends EventEmitter {
  static constitute() { return [Config, Log, Container] }
  constructor(config, log, container) {
    super()
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
    // TODO add message
    const response = yield superagent.get(options.paymentUri, {
      amount: options.amount
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
    const destinationAmount = params.destinationAmount || (yield this.sender.quoteSourceAmount('wallet2.alice', params.sourceAmount))

    const request = yield this.getReceiver({
      paymentUri: params.destination.paymentUri,
      amount: destinationAmount
    })

    return this.sender.quoteRequest(request)
  }

  * pay(paymentParams) {
    console.log(paymentParams);
    return this.sender.payRequest(paymentParams)
  }

  /**
   * Receiver
   */
  * createRequest(amount) {
    this.receiver = ILP.createReceiver({
      _plugin: FiveBellsLedgerPlugin,
      prefix: 'wallet2.',
      account: 'http://wallet2.com/ledger/accounts/alice',
      password: 'alice'
    })

    yield this.receiver.listen()

    // TODO do we need this?
    this.receiver.on('incoming', (transfer, fulfillment) => {
      console.log('ayayayay', transfer, fulfillment);
    })

    return this.receiver.createRequest({
      amount: amount
    })
  }
}
