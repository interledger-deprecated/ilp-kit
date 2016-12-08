"use strict"

const Socket = require('../lib/socket')
const SPSP = require('../lib/spsp')
const Utils = require('../lib/utils')
const PaymentFactory = require('../models/payment')

const InsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

module.exports = class Pay {
  static constitute() { return [Socket, SPSP, PaymentFactory, Utils] }
  constructor(socket, spsp, Payment, utils) {
    this.socket = socket
    this.spsp = spsp
    this.utils = utils
    this.Payment = Payment
  }

  * pay(opts) {
    let transfer

    const destination = yield this.utils.parseDestination({
      destination: opts.destination
    })

    /**
     * Ledger payment
     */

    try {
      transfer = yield this.spsp.pay({
        source: opts.source,
        destination: destination,
        sourceAmount: opts.sourceAmount,
        destinationAmount: opts.destinationAmount,
        memo: opts.message
      })
    } catch (e) {
      if (e.response && e.response.body && e.response.body.id && e.response.body.id === 'InsufficientFundsError') {
        throw new InsufficientFundsError()
      }

      throw e
    }

    /**
     * Store the payment in the wallet db
     */

    // Get the db entry if the payment is local
    let dbPayment = yield this.Payment.findOne({
      where: { execution_condition: transfer.executionCondition }
    })

    // Create a db entry if the payment is interledger
    if (!dbPayment) {
      dbPayment = new this.Payment()
    }

    // Save in the db
    dbPayment.setDataExternal({
      source_user: opts.source.id,
      source_account: opts.source.account,
      source_amount: parseFloat(opts.sourceAmount),
      destination_account: opts.destination.accountUri,
      destination_amount: parseFloat(opts.destinationAmount),
      destination_name: opts.destination.name,
      destination_image_url: opts.destination.imageUrl,
      transfer: transfer.uuid,
      message: opts.message || null,
      execution_condition: transfer.executionCondition,
      state: 'success'
    })
    dbPayment = yield dbPayment.save()

    /**
     * Notify affected accounts
     */

    // TODO who do we notify?
    this.socket.payment(opts.source.username, this.Payment.fromDatabaseModel(dbPayment).getDataExternal())
  }
}
