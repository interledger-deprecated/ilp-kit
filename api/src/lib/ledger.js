"use strict"

const _ = require('lodash')
const co = require('co')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const uuid = require ('uuid4')
const crypto = require('crypto')
const WebSocket = require('ws')
const reconnectCore = require('reconnect-core')
const Container = require('constitute').Container
const sender = require('five-bells-sender')
const condition = require('five-bells-condition')
const EventEmitter = require('events').EventEmitter

const PaymentFactory = require('../models/payment')
const UserFactory = require('../models/user')

const Config = require('./config')
const Log = require('./log')

const NotFoundError = require('../errors/not-found-error')

// TODO exception handling
module.exports = class Ledger extends EventEmitter {
  static constitute () { return [Config, Log, Container] }
  constructor (config, log, container) {
    super()

    const self = this

    this.config = config.data
    this.log = log('ledger')
    this.ledgerUri = this.config.getIn(['ledger', 'uri'])
    this.ledgerUriPublic = this.config.getIn(['ledger', 'public_uri'])

    container.schedulePostConstructor((User, Payment) => {
      self.User = User
      self.Payment = Payment
    }, [ UserFactory, PaymentFactory ])
  }

  // TODO caching
  * getInfo(uri) {
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

  * subscribe() {
    const self = this

    const options = {
      headers: {
        Authorization: 'Basic ' + new Buffer(
          this.config.getIn(['ledger', 'admin', 'name'])
          + ':'
          + this.config.getIn(['ledger', 'admin', 'pass']), 'utf8').toString('base64')
      }
    }

    const streamUri = this.ledgerUri + '/accounts/*/transfers'

    const reconnect = reconnectCore(() => {
      return new WebSocket(streamUri, options)
    })

    reconnect({immediate: true}, (ws) => {
      ws.on('open', () => {
        self.log.info('ws connected to ' + streamUri)
      })
      ws.on('message', (msg) => {co(function *() {
        const notification = JSON.parse(msg)
        self.log.debug('notify', notification.resource.id)
        try {
          yield self.handleNotification(notification)
        } catch (err) {
          self.log.warn('failure while processing notification: ' + err)
        }
      })})
      ws.on('close', () => {
        self.log.info('ws disconnected from ' + streamUri)
      })
    })
    .on('error', (err) => {
      self.log.warn('ws error on ' + streamUri + ': ' + err)
    })
    .connect()
  }

  * handleNotification(notification) {
    const self = this
    const transfer = notification.resource
    if (transfer.state === 'prepared') {
      // Sender doesn't need to do anything at this point
      if (transfer.credits[0].memo.receiver_payment_id) {
        self.preparedEvent(transfer)
      }
      return
    }

    if (transfer.state !== 'executed') {
      return
    }

    const debit = transfer.debits[0]
    const credit = transfer.credits[0]
    const additionalInfo = (credit.memo && credit.memo.ilp_header) ? credit.memo.ilp_header.data : credit.memo

    let paymentObj = {
      transfers: transfer.id,
      source_account: (additionalInfo && additionalInfo.source_account) || debit.account,
      destination_account: (additionalInfo && additionalInfo.destination_account) || credit.account,
      source_amount: (additionalInfo && additionalInfo.source_amount) || debit.amount,
      destination_amount: (additionalInfo && additionalInfo.destination_amount) || credit.amount,
      state: 'success'
    }

    // TODO move this logic somewhere else
    // Source user
    if (_.startsWith(debit.account, self.config.getIn(['ledger', 'public_uri']) + '/accounts/')) {
      let user = yield self.User.findOne({where: {username: debit.account.slice(self.config.getIn(['ledger', 'public_uri']).length + 10)}})
      if (user) {
        paymentObj.source_user = user.id
      }
    }
    // Destination user
    if (_.startsWith(credit.account, self.config.getIn(['ledger', 'public_uri']) + '/accounts/')) {
      let user = yield self.User.findOne({where: {username: credit.account.slice(self.config.getIn(['ledger', 'public_uri']).length + 10)}})
      if (user) {
        paymentObj.destination_user = user.id
      }
    }

    let payment

    const creditMemo = credit.memo

    // Receiver: Get the pending payment
    if (creditMemo && creditMemo.receiver_payment_id) {
      payment = yield self.Payment.findOne({where: {id: creditMemo.receiver_payment_id}})
    }

    // Sender: Get the pending payment
    if (!payment) {
      payment = yield self.Payment.findOne({where: {transfers: transfer.id}})
    }
    // Payment is not prepared
    if (!payment) {
      payment = new self.Payment()
    }
    payment.setDataExternal(paymentObj)

    try {
      yield payment.save()
    } catch (e) {
      // TODO handle
    }

    self.emitTransferEvent(transfer)
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

  * transfer(options) {
    let response
    let sourceAccount = this.ledgerUriPublic + '/accounts/' + options.username

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

    return response.body
  }
}
