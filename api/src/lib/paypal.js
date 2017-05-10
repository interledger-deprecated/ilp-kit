'use strict'

const request = require('superagent')
const Config = require('./config')
const SettlementMethodFactory = require('../models/settlement_method')
const debug = require('debug')('ilp-kit:paypal')

module.exports = class Paypal {
  constructor (deps) {
    this.config = deps(Config)
    this.SettlementMethod = deps(SettlementMethodFactory)
  }

  async getOptions () {
    if (this.options) return this.options

    this.options = (await this.SettlementMethod.findOne({ where: { type: 'paypal' } })).options
    this.options.api = this.options.sandbox ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'

    return this.options
  }

  async getToken () {
    if (this.token) return this.token

    debug('fetching auth token...')

    const options = await this.getOptions()

    const res = await request
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

  async createPayment (destination, amount) {
    const options = await this.getOptions()
    const token = await this.getToken()

    debug('creating a payment')

    const res = await request
      .post(`${options.api}/v1/payments/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        intent: 'sale',
        redirect_urls: {
          return_url: `${this.config.data.getIn(['server', 'base_uri'])}/settlements/${destination}/paypal/execute`,
          cancel_url: `${this.config.data.getIn(['server', 'base_uri'])}/settlements/${destination}/paypal/cancel`
        },
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: parseFloat(amount).toFixed(2),
            currency: 'USD' // TODO: support currencies
          },
          description: `Memo: ${destination}`
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

  async executePayment (query) {
    const options = await this.getOptions()
    const token = await this.getToken()

    debug('executing the payment: ')

    const res = await request
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
