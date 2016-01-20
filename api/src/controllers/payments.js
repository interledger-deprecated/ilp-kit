"use strict"

module.exports = PaymentsControllerFactory

const co = require('co')
const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const requestUtil = require('five-bells-shared/utils/request')
const InvalidLedgerAccountError = require('../errors/invalid-ledger-account-error')
const Model = require('five-bells-shared').Model
const PaymentFactory = require('../models/payment')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')

PaymentsControllerFactory.constitute = [PaymentFactory, Log, DB, Config, Ledger]
function PaymentsControllerFactory (Payment, log, db, config, ledger) {
  log = log('payments')

  return class PaymentsController {
    // TODO check auth for all the routes
    static init (router) {
      let self = this;
      router.get('/payments', this.getHistory)
      router.get('/payments/:id', this.getResource)
      router.put('/payments/:id', Payment.createBodyParser(), self.putResource)
      //router.put('/payments/:id/fulfillment', Model.createBodyParser(), this.putFulfillmentResource)
    }

    static * getHistory () {
      const self = this
      // TODO pagination
      const payments = yield Payment.getUserPayments(self.req.user)

      if (!payments) {
        this.status = 404
        return
      }

      this.body = _.map(payments, (payment) => {
        return payment.getDataExternal()
      });
    }

    static * getResource () {
      let id = this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()

      const item = yield Payment.getPayment(this.params.id)

      if (!item) {
        this.status = 404
        return
      }

      this.body = item.getDataExternal()
    }

    static * putResource () {
      const _this = this

      let id = _this.params.id
      requestUtil.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()
      let payment = this.body

      payment.id = id

      // TODO store source and destinations users
      delete payment.destination_user

      payment.source_user = this.req.user.id

      // TODO cleanup
      // TODO fill the destination_user
      const options = {
        recipient: payment.destination_account,
        amount: payment.source_amount,
        username: this.req.user.username,
        password: this.req.user.password
      }

      try {
        const transfer = yield ledger.transfer(options)

        log.debug('Ledger transfer payment ID ' + id)
      } catch (e) {
        let error = JSON.parse(e.response.error.text);
        if (error.id === 'UnprocessableEntityError') {
          throw new InvalidLedgerAccountError(error.message);
        }
      }

      let created
      yield db.transaction(function * (transaction) {
        created = yield payment.create({ transaction })
      })

      payment = yield Payment.getPayment(payment.id);

      // TODO Should be in the same format as historyItem
      this.body = payment.getDataExternal()
    }
  }
}
