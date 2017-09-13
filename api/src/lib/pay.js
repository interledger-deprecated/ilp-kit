'use strict'

const Socket = require('../lib/socket')
const SPSP = require('../lib/spsp')
const Utils = require('../lib/utils')
const Activity = require('../lib/activity')
const Config = require('../lib/config')
const PaymentFactory = require('../models/payment')
const WithdrawalFactory = require('../models/withdrawal')

const InsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

module.exports = class Pay {
  constructor (deps) {
    this.socket = deps(Socket)
    this.spsp = deps(SPSP)
    this.utils = deps(Utils)
    this.activity = deps(Activity)
    this.config = deps(Config)
    this.Payment = deps(PaymentFactory)
    this.Withdrawal = deps(WithdrawalFactory)
  }

  async _payment (source, quote, message) {
    /**
     * Ledger payment
     */
    try {
      await this.spsp.pay(
        source.username,
        Object.assign({}, quote, { headers: {
          'Source-Identifier': source.identifier,
          'Source-Name': source.name || source.identifier,
          'Source-Image-Url': this.utils.userToImageUrl(source),
          'Message': message || ''
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
    return this.Payment.createOrUpdate({
      source_user: source.id,
      source_identifier: source.identifier,
      source_amount: parseFloat(quote.sourceAmount),
      destination_identifier: quote.spsp.receiver_info.identifier,
      destination_amount: parseFloat(quote.destinationAmount),
      destination_name: quote.spsp.receiver_info.name,
      destination_image_url: quote.spsp.receiver_info.image_url,
      transfer: quote.id,
      message: message || null,
      // execution_condition: transfer.executionCondition,
      state: 'success'
    })
  }

  async pay (opts) {
    const payment = await this._payment(opts.user, opts.quote, opts.message)

    await this.activity.processPayment(payment, opts.user)

    return payment
  }

  async withdraw (user, amount) {
    const destination = this.config.data.getIn(['ledger', 'admin', 'user']) +
      '@' + this.config.data.getIn(['server', 'public_host'])

    const quote = await this.spsp.quote({
      user: user.getDataExternal(),
      destination,
      destinationAmount: amount
    })

    // Send the money
    const payment = await this._payment(user.getDataExternal(), quote, 'Withdrawal')

    let withdrawal = new this.Withdrawal()
    withdrawal.amount = amount
    withdrawal.status = 'pending'
    withdrawal.transfer_id = payment.id
    withdrawal.user_id = user.id
    withdrawal = await withdrawal.save()

    await this.activity.processWithdrawal(withdrawal)
  }
}
