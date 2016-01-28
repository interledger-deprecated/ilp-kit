"use strict"

module.exports = PaymentsControllerFactory

const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const PaymentFactory = require('../models/payment')
const InvalidLedgerAccountError = require('../errors/invalid-ledger-account-error')
const LedgerInsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

PaymentsControllerFactory.constitute = [Auth, PaymentFactory, Log, Ledger]
function PaymentsControllerFactory (Auth, Payment, log, ledger) {
  log = log('payments')

  return class PaymentsController {
    static init (router) {
      router.get('/payments', Auth.isAuth, this.getHistory)
      router.get('/payments/:id', Auth.isAuth, this.getResource)
      router.put('/payments/:id', Auth.isAuth, Payment.createBodyParser(), this.putResource)
    }

    static * getHistory () {
      // TODO pagination
      const payments = yield Payment.getUserPayments(this.req.user)

      this.body = _.map(payments, (payment) => {
        return payment.getDataExternal()
      })
    }

    static * getResource () {
      let id = this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()

      const item = yield Payment.getPayment(id)

      if (!item) {
        this.status = 404
        return
      }

      this.body = item.getDataExternal()
    }

    static * putResource () {
      const _this = this

      let id = _this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()
      let payment = this.body

      payment.id = id

      // TODO store source and destinations users
      delete payment.destination_user

      payment.source_user = this.req.user.id

      // TODO fill the destination_user
      const options = {
        recipient: payment.destination_account,
        amount: payment.source_amount,
        username: this.req.user.username,
        password: this.req.user.password
      }

      // Try doing the ledger transaction
      try {
        const transfer = yield ledger.transfer(options)

        payment.transfers = [transfer.id]

        log.debug('Ledger transfer payment ID ' + id)
      } catch (e) {
        let error = JSON.parse(e.response.error.text)

        if (error.id === 'UnprocessableEntityError') {
          throw new InvalidLedgerAccountError(error.message)
        } else if (error.id === 'InsufficientFundsError') {
          throw new LedgerInsufficientFundsError(error.message)
        } else {
          // TODO more meaningful error
          throw new Error()
        }
      }

      // Store the payment in db
      yield payment.create()

      // Get the payment with the associations
      payment = yield Payment.getPayment(payment.id)

      this.body = payment.getDataExternal()
    }
  }
}
