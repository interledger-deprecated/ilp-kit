'use strict'

const Socket = require('../lib/socket')
const SPSP = require('../lib/spsp')
const Utils = require('../lib/utils')
const Activity = require('../lib/activity')
const PaymentFactory = require('../models/payment')

const InsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

module.exports = class Pay {
  constructor (deps) {
    this.socket = deps(Socket)
    this.spsp = deps(SPSP)
    this.utils = deps(Utils)
    this.activity = deps(Activity)
    this.Payment = deps(PaymentFactory)
  }

  async pay (opts) {
    /**
     * Ledger payment
     */
    try {
      await this.spsp.pay(
        opts.user.username,
        Object.assign({}, opts.quote, { headers: {
          'Source-Identifier': opts.user.identifier,
          'Message': opts.message || ''
        }}))
    } catch (e) {
      if (e.response && e.response.body && e.response.body.id && e.response.body.id === 'InsufficientFundsError') {
        throw new InsufficientFundsError()
      }

      throw e
    }

    /**
     * Store the payment in the wallet db
     */
    const payment = await this.Payment.createOrUpdate({
      source_user: opts.user.id,
      source_identifier: opts.user.identifier,
      source_amount: parseFloat(opts.quote.sourceAmount),
      destination_identifier: opts.destination.identifier,
      destination_amount: parseFloat(opts.quote.destinationAmount),
      // destination_name: destination.name,
      // destination_image_url: destination.imageUrl,
      transfer: opts.quote.id,
      message: opts.message || null,
      // execution_condition: transfer.executionCondition,
      state: 'success'
    })

    await this.activity.processPayment(payment, opts.user)
  }
}
