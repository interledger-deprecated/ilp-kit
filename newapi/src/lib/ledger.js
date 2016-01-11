"use strict"

const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')

const Config = require('../lib/config')

// TODO exception handling
module.exports = class Ledger {
  static constitute () { return [Config] }
  constructor (config) {
    this.config = config
    this.ledgerUrl = 'http://' + this.config.ledger.host + ':' + this.config.ledger.port
  }

  * getAccount (user, admin) {
    const response = yield superagent
      .get(this.ledgerUrl + '/accounts/' + user.username)
      .auth(admin ? this.config.ledger.admin.name : user.username, admin ? this.config.ledger.admin.pass : user.password)
      .end()

    return response.body
  }

  * createAccount(user) {
    try {
      const response = yield superagent
        .put(this.ledgerUrl + '/accounts/' + user.username)
        .send({
          name: user.username,
          password: user.password,
          balance: ''+user.balance || '1000'
        })
        .auth(this.config.ledger.admin.name, this.config.ledger.admin.pass)
      return response.body
    } catch (e) {
      // TODO handle
    }
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