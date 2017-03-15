'use strict'

const Socket = require('../lib/socket')
const SPSP = require('../lib/spsp')
const Utils = require('../lib/utils')
const Activity = require('../lib/activity')
const PaymentFactory = require('../models/payment')

const InsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

module.exports = class Pay {
  static constitute () { return [Socket, SPSP, PaymentFactory, Utils, Activity] }
  constructor (socket, spsp, Payment, utils, activity) {
    this.socket = socket
    this.spsp = spsp
    this.utils = utils
    this.activity = activity
    this.Payment = Payment
  }

  * pay (opts) {
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
    const payment = yield this.Payment.createOrUpdate({
      source_user: opts.source.id,
      source_identifier: this.utils.getWebfingerAddress(opts.source.username),
      source_amount: parseFloat(opts.sourceAmount),
      destination_identifier: destination.identifier,
      destination_amount: parseFloat(opts.destinationAmount),
      destination_name: destination.name,
      destination_image_url: destination.imageUrl,
      transfer: transfer.uuid,
      message: opts.message || null,
      execution_condition: transfer.executionCondition,
      state: 'success'
    })

    yield this.activity.processPayment(payment, opts.source)
  }
}
