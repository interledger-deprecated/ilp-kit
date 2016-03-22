"use strict"

const _ = require('lodash')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')
const sender = require('five-bells-sender')
const EventEmitter = require('events').EventEmitter

const Config = require('./config')
const Log = require('./log')

// TODO exception handling
module.exports = class Ledger extends EventEmitter {
  static constitute () { return [Config, Log] }
  constructor (config, log) {
    super()
    this.config = config.data
    this.log = log('ledger')
    this.ledgerUri = this.config.getIn(['ledger', 'uri'])
    this.ledgerUriPublic = this.config.getIn(['ledger', 'public_uri'])
  }

  * getInfo () {
    try {
      this.log.info('getting ledger info ' + this.ledgerUri)
      const response = yield superagent.get(this.ledgerUri).end()

      return response.body
    } catch (err) {
      if (err.status !== 422) throw err
    }
  }

  * subscribe () {
    try {
      this.log.info('subscribing to ledger ' + this.ledgerUri)
      const response = yield superagent
        .put(this.ledgerUri + '/subscriptions/' + uuid())
        .auth(this.config.getIn(['ledger', 'admin', 'name']), this.config.getIn(['ledger', 'admin', 'pass']))
        .send({
          'owner': this.config.getIn(['ledger', 'admin', 'name']),
          'event': '*',
          'subject': '*',
          'target': this.config.getIn(['server', 'base_uri']) + '/notifications' // TODO server.base_uri???
        })
        .end()
    } catch (err) {
      if (err.status !== 422) throw err
    }
  }

  emitTransferEvent (transfer) {
    this.log.debug('received notification for transfer ' + transfer.id)
    const affectedAccounts = _.uniq(transfer.debits.map((debit) => debit.account)
      .concat(transfer.credits.map((credit) => credit.account)))
      .map((uri) => {
        if (!_.startsWith(uri, this.ledgerUriPublic + '/accounts/')) {
          throw new Error('received an invalid notification')
        }

        return uri.slice(this.ledgerUriPublic.length + 10)
      })

    // TODO who should emit this events? might make more sense if the event
    // has the payment object, not transfer
    this.log.debug('posting notification to accounts ' + affectedAccounts.join(','))
    affectedAccounts.forEach((account) => this.emit('transfer_' + account, transfer))
  }

  * getAccount (user, admin) {
    try {
      const response = yield superagent
        .get(this.ledgerUri + '/accounts/' + user.username)
        .auth(admin ? this.config.getIn(['ledger', 'admin', 'name']) : user.username, admin ? this.config.getIn(['ledger', 'admin', 'pass']): user.password)
        .end()

      return response.body
    } catch (e) {
      this.log.critical(e)
    }
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
        .put(this.ledgerUri + '/accounts/' + user.username)
        .send(data)
        // TODO do we need auth?
        .auth(this.config.getIn(['ledger', 'admin', 'name']), this.config.getIn(['ledger', 'admin', 'pass']))
      return response.body
    } catch (e) {
      // TODO handle
    }
  }

  findPath(options) {
    let pathOptions = {
      sourceAccount: this.ledgerUriPublic + '/accounts/' + options.username,
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
    let sourceAccount = this.ledgerUriPublic + '/accounts/' + options.username

    // Interledger
    // TODO Use a better mechanism to check if the destinationAccount is in a different ledger
    if (!options.destinationAccount.indexOf('http://') || !options.destinationAccount.indexOf('https://')) {
      response = yield sender.executePayment(options.path, {
        sourceAccount: sourceAccount,
        sourcePassword: options.password,
        destinationAccount: options.destinationAccount,
        additionalInfo: {
          source_account: sourceAccount,
          source_amount: options.path[0].source_transfers[0].debits[0].amount,
          destination_account: options.destinationAccount,
          destination_amount: options.path[0].destination_transfers[0].credits[0].amount
        }
      })

      response = response[0]
    }
    else {
      const paymentId = uuid()

      response = yield superagent
        .put(this.ledgerUri + '/transfers/' + paymentId)
        .send({
          debits: [{
            account: sourceAccount,
            amount: options.destinationAmount,
            authorized: true
          }],
          credits: [{
            account: this.ledgerUriPublic + '/accounts/' + options.destinationAccount,
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
