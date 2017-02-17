"use strict"

const request = require('superagent')
const Config = require('./config')
const SettlementMethodFactory = require('../models/settlement_method')
const debug = require('debug')('ilp-kit:paypal')

module.exports = class Paypal {
  static constitute() { return [Config, SettlementMethodFactory] }
  constructor(config, SettlementMethod) {
    this.config = config
    this.SettlementMethod = SettlementMethod
  }

  * getOptions() {
    if (this.options) return this.options

    this.options = (yield this.SettlementMethod.findOne({ where: { type: 'paypal' } })).options
    this.options.api = this.options.sandbox ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'

    return this.options
  }

  * getToken() {
    if (this.token) return this.token

    debug('fetching auth token...')

    const options = yield this.getOptions()

    const res = yield request
      .post(`${options.api}/v1/oauth2/token`)
      .type('form')
      .send({ grant_type: 'client_credentials' })
      .auth(options.clientId, options.secret)

    this.token = res.body.access_token

    // Token expiration
    setTimeout(() => {
      this.token = null
      // expire the token a little before the server does, to be safe
    }, (res.body.expires_in - 1) * 1000)

    debug('got token', this.token)

    return this.token
  }

  * createPayment(peer, amount) {
    const options = yield this.getOptions()
    const token = yield this.getToken()

    debug('creating a payment')

    const res = yield request
      .post(`${options.api}/v1/payments/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        intent: 'sale',
        redirect_urls: {
          return_url: `${this.config.data.getIn(['server', 'base_uri'])}/settlements/${peer.destination}/paypal/execute`,
          cancel_url: `${this.config.data.getIn(['server', 'base_uri'])}/settlements/${peer.destination}/paypal/cancel`
        },
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: parseFloat(amount).toFixed(2),
            currency: 'USD' // TODO: support currencies
          },
          description: `Memo: ${peer.destination}`
        }]
      })

    let approvalLink

    res.body.links.map(link => {
      if (link.rel === 'approval_url') {
        approvalLink = link.href
      }
    })

    return approvalLink
  }

  * executePayment(query) {
    const options = yield this.getOptions()
    const token = yield this.getToken()

    debug('executing the payment: ')

    const res = yield request
      .post(`${options.api}/v1/payments/payment/${query.paymentId}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        payer_id: query.PayerID
      })

    if (res.body.state !== 'approved') {
      debug('Failed to execute the payment')

      throw new Error('Failed to execute the payment')
    }

    return {
      amount: res.body.transactions[0].amount.total,
      destination: res.body.transactions[0].description.replace(/Memo: /, '')
    }
  }
}
