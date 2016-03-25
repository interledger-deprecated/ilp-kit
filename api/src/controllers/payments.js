"use strict"

module.exports = PaymentsControllerFactory

const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Config = require('../lib/config')
const Utils = require('../lib/utils')
const PaymentFactory = require('../models/payment')
const InvalidLedgerAccountError = require('../errors/invalid-ledger-account-error')
const LedgerInsufficientFundsError = require('../errors/ledger-insufficient-funds-error')
const NoPathsError = require('../errors/no-paths-error')

PaymentsControllerFactory.constitute = [Auth, PaymentFactory, Log, Ledger, Config, Utils]
function PaymentsControllerFactory (Auth, Payment, log, ledger, config, utils) {
  log = log('payments')

  return class PaymentsController {
    static init (router) {
      router.get('/payments', Auth.isAuth, this.getHistory)
      //router.get('/payments/:id', Auth.isAuth, this.getResource)
      router.put('/payments/:id', Auth.isAuth, Payment.createBodyParser(), this.putResource)
      router.post('/payments/findPath', Auth.isAuth, this.findPath)
    }

    static * getHistory () {
      const page = this.query.page
      const limit = this.query.limit

      const payments = yield Payment.getUserPayments(this.req.user, page, limit)

      this.body = {
        list: payments.rows,
        totalPages: Math.ceil(payments.count / limit)
      }
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

    // TODO handle payment creation. Shouldn't rely on notification service
    // TODO same ledger payment using webfinger shows two payments in history
    static * putResource () {
      const _this = this

      let id = _this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()
      let payment = this.body

      payment.id = id

      payment.source_user = this.req.user.id

      let destination = yield utils.parseDestination({
        destination: payment.destination_account
      })

      // TODO fill the destination_user
      const options = {
        sourceAmount: payment.source_amount,
        destination: destination,
        destinationAmount: payment.destination_amount,
        path: payment.path,
        username: this.req.user.username,
        password: this.req.user.password
      }

      // Try doing the ledger transaction
      let transfer

      try {
        transfer = yield ledger.transfer(options)

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

      // TODO should be something more meaningful
      this.body = {'status': 'OK'}
    }

    // TODO handle not supplied params
    static * findPath () {
      let destination

      try {
        destination = yield utils.parseDestination({
          destination: this.body.destination
        })
      } catch (e) {
        // TODO differentiate doesn't exist from parsing error
        throw new InvalidLedgerAccountError("Account doesn't exist")
      }

      if (destination.type === 'local') {
        let amount = this.body.source_amount || this.body.destination_amount

        this.body = {
          sourceAmount: amount,
          destinationAmount: amount
        }

        return
      }

      const options = {
        destination: destination,
        sourceAmount: this.body.source_amount,
        destinationAmount: this.body.destination_amount,
        username: this.req.user.username
      }

      let path = yield ledger.findPath(options)

      if (!path) {
        throw new NoPathsError("No paths to specified destination found")
      }

      this.body = path
    }
  }
}
