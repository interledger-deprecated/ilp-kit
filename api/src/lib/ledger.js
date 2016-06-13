"use strict"

const _ = require('lodash')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')
const crypto = require('crypto')
const sender = require('five-bells-sender')
const condition = require('five-bells-condition')
const EventEmitter = require('events').EventEmitter

const Config = require('./config')
const Log = require('./log')

const NotFoundError = require('../errors/not-found-error')

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

  // TODO caching
  * getInfo (uri) {
    const ledgerUri = uri || this.ledgerUri
    let response

    try {
      this.log.info('getting ledger info ' + ledgerUri)
      response = yield superagent.get(ledgerUri).end()
    } catch (err) {
      if (err.status !== 422) throw err
    }

    return response.body
  }

  * subscribe () {
    try {
      this.log.info('subscribing to ledger ' + this.ledgerUri)
      yield superagent
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

  getCondition (paymentId) {
    const cond = new condition.PreimageSha256()
    const conditionSecret = this.config.getIn('conditionSecret')
    cond.setPreimage(crypto.createHmac('sha256', conditionSecret).update(paymentId).digest())

    return cond
  }

  getFulfillment (paymentId) {
    return this.getCondition(paymentId).serializeUri()
  }

  preparePayment () {
    const paymentId = uuid()
    return {
      paymentId: paymentId,
      receipt_condition: this.getCondition(paymentId).getConditionUri()
    }
  }

  preparedEvent (transfer) {
    this.log.debug('received notification for prepared transfer ' + transfer.id)

    superagent
      .put(transfer.id + '/fulfillment')
      .auth(this.config.getIn(['ledger', 'admin', 'name']), this.config.getIn(['ledger', 'admin', 'pass']))
      .send(this.getFulfillment(transfer.credits[0].memo.receiver_payment_id))
      .end()
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
    let response

    try {
      response = yield superagent
        .get(this.ledgerUri + '/accounts/' + user.username)
        .auth(admin ? this.config.getIn(['ledger', 'admin', 'name']) : user.username, admin ? this.config.getIn(['ledger', 'admin', 'pass']): user.password)
        .end()
    } catch (e) {
      if (e.response && e.response.body) {
        if (e.response.body.id === 'NotFoundError') {
          throw new NotFoundError(e.response.body.message)
        } else if (e.response.body.id === 'UnauthorizedError') {
          throw new NotFoundError(e.response.body.message)
        }
      }
    }

    return response.body
  }

  * putAccount(auth, data) {
    let response

    try {
      response = yield superagent
        .put(this.ledgerUri + '/accounts/' + data.name)
        .send(data)
        .auth(auth.username, auth.password)
    } catch (e) {
      console.log('ledger.js:141', e)
      // TODO handle
    }

    return response.body
  }

  updateAccount(user, admin) {
    let data = {
      name: user.username
    }

    if (user.balance) {
      data.balance = user.balance
    }

    if (user.newPassword) {
      data.password = user.newPassword
    }

    if (admin) {
      user = {
        username: this.config.getIn(['ledger', 'admin', 'name']),
        password: this.config.getIn(['ledger', 'admin', 'pass'])
      }
    }

    return this.putAccount(user, data)
  }

  createAccount(user) {
    let data = {
      name: user.username,
      balance: user.balance ? ''+user.balance : '1000'
    }

    if (user.password) {
      data.password = user.password
    }

    return this.putAccount({
      username: this.config.getIn(['ledger', 'admin', 'name']),
      password: this.config.getIn(['ledger', 'admin', 'pass'])
    }, data)
  }

  findPath(options) {
    let pathOptions = {
      sourceAccount: this.ledgerUriPublic + '/accounts/' + options.username,
      destinationAccount: options.destination.accountUri
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
    if (options.destination.type === 'foreign') {
      let paymentObj = {
        sourceAccount: sourceAccount,
        sourcePassword: options.password,
        destinationAccount: options.destination.accountUri
      }

      // Message
      let postData = options.message ? {memo: options.message} : {}

      const resp = yield superagent.post(options.destination.paymentUri, postData)

      paymentObj.destinationMemo = {
        receiver_payment_id: resp.body.paymentId,
        source_account: sourceAccount,
        source_amount: options.path.debits[0].amount,
        destination_account: options.destination.accountUri,
        destination_amount: options.path.credits[0].memo.ilp_header.amount
      }

      if (options.source_memo) {
        paymentObj.sourceMemo.userMemo = options.source_memo
      }

      if (options.destination_memo) {
        paymentObj.destinationMemo.userMemo = options.destination_memo
      }

      paymentObj.receiptCondition = resp.body.receipt_condition

      try {
        response = yield sender.executePayment(options.path, paymentObj)
      } catch (e) {
        // TODO handle
      }
    }
    else {
      const paymentId = uuid()

      let debit = {
        account: sourceAccount,
        amount: options.destinationAmount,
        authorized: true
      }

      if (options.source_memo) {
        debit.memo = {userMemo: options.source_memo}
      }

      let credit = {
        account: options.destination.accountUri,
        amount: options.destinationAmount
      }

      if (options.destination_memo) {
        credit.memo = {userMemo: options.destination_memo}
      }

      response = yield superagent
        .put(this.ledgerUri + '/transfers/' + paymentId)
        .send({
          debits: [debit],
          credits: [credit],
          // TODO shouldn't be fixed
          expires_at: "2018-06-16T00:00:01.000Z"
        })
        .auth(options.username, options.password)

      response = response.body
    }

    return response
  }
}
