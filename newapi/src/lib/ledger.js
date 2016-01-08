"use strict"

const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')

const Config = require('../lib/config')

module.exports = class Ledger {
  static constitute () { return [Config] }
  constructor (config) {
    this.config = config
    this.ledgerUrl = this.config.ledger.host + ':' + this.config.ledger.port
  }

  // TODO exception handling
  * getAccount (user, admin) {
    const response = yield superagent
      .get(this.ledgerUrl + '/accounts/' + user.username)
      .auth(admin ? this.config.ledger.admin.name : user.username, admin ? this.config.ledger.admin.pass : user.password)
      .end()

    return response.body
  }

  * create(user) {
    const response = yield superagent
      .put(this.ledgerUrl + '/accounts/' + user.name)
      .send({
        name: user.name,
        password: user.password,
        balance: user.balance || '1000'
      })
      .auth(this.config.ledger.admin.name, this.config.ledger.admin.password)

    return response.body
  }

  * transfer(options) {
    const paymentId = uuid()

    const response = yield superagent
      .put(this.ledgerUrl + '/transfers/' + paymentId)
      .send({
        debits: [{
          account: this.ledgerUrl + '/accounts/' + options.username,
          amount: options.amount,
          authorized: true
        }],
        credits: [{
          account: this.ledgerUrl + '/accounts/' + options.recipient,
          amount: options.amount
        }],
        expires_at: "2016-06-16T00:00:01.000Z"
      })
      .auth(options.username, options.password)

    return response.body
  }
}