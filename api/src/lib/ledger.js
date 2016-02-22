"use strict"

const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')
const sender = require('five-bells-sender')

const Config = require('../lib/config')

// TODO exception handling
module.exports = class Ledger {
  static constitute () { return [Config] }
  constructor (config) {
    this.config = config
    this.ledgerUri = this.config.ledger.uri
    this.ledgerUriPrivate = this.config.ledger.uriPrivate
  }

  * getAccount (user, admin) {
    const response = yield superagent
      .get(this.ledgerUriPrivate + '/accounts/' + user.username)
      .auth(admin ? this.config.ledger.admin.name : user.username, admin ? this.config.ledger.admin.pass : user.password)
      .end()

    return response.body
  }

  * createAccount(user) {
    try {
      let data = {
        name: user.username,
        balance: user.balance ? ''+user.balance : '1000'
      }

      if (user.password) {
        data.password = user.password
      }

      const response = yield superagent
        .put(this.ledgerUriPrivate + '/accounts/' + user.username)
        .send(data)
        .auth(this.config.ledger.admin.name, this.config.ledger.admin.pass)
      return response.body
    } catch (e) {
      // TODO handle
    }
  }

  * findPath(options) {
    let pathOptions = {
      sourceAccount: this.ledgerUri + '/accounts/' + options.username,
      destinationAccount: options.destinationAccount
    }

    if (options.sourceAmount) {
      pathOptions.sourceAmount = options.sourceAmount
    } else {
      pathOptions.destinationAmount = options.destinationAmount
    }

    return sender.findPath(pathOptions)
  }

  * transfer(options) {
    let response

    // Interledger
    // TODO Use a better mechanism to check if the destinationAccount is in a different ledger
    if (!options.destinationAccount.indexOf('http://')) {
      response = yield sender.executePayment(options.path, {
        sourceAccount: this.ledgerUri + '/accounts/' + options.username,
        sourcePassword: options.password,
        destinationAccount: options.destinationAccount
      })

      response = response[0]
    }
    else {
      const paymentId = uuid()

      response = yield superagent
        .put(this.ledgerUriPrivate + '/transfers/' + paymentId)
        .send({
          debits: [{
            account: this.ledgerUri + '/accounts/' + options.username,
            amount: options.destinationAmount,
            authorized: true
          }],
          credits: [{
            account: this.ledgerUri + '/accounts/' + options.destinationAccount,
            amount: options.destinationAmount
          }],
          expires_at: "2016-06-16T00:00:01.000Z"
        })
        .auth(options.username, options.password)

      response = response.body
    }

    return response
  }
}
