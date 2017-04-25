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
    /**
     * Ledger payment
     */
    try {
      transfer = yield this.spsp.pay(
        opts.user.username,
        Object.assign({}, opts.quote, { headers: {
          'Source-Identifier': opts.user.identifier,
          'Source-Name': opts.user.name,
          'Source-Image-Url': this.utils.userToImageUrl(opts.user),
          'Message': opts.message || '',
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
    const payment = yield this.Payment.createOrUpdate({
      source_user: opts.user.id,
      source_identifier: opts.user.identifier,
      source_amount: parseFloat(opts.quote.sourceAmount),
      destination_identifier: opts.destination.identifier,
      destination_amount: parseFloat(opts.quote.destinationAmount),
      destination_name: opts.quote.spsp.receiver_info.name,
      destination_image_url: opts.quote.spsp.receiver_info.image_url,
      transfer: opts.quote.id,
      message: opts.message || null,
      // execution_condition: transfer.executionCondition,
      state: 'success'
    })

    yield this.activity.processPayment(payment, opts.user)
  }
}
