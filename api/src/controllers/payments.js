"use strict"

module.exports = PaymentsControllerFactory

const co = require('co')
const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const requestUtil = require('five-bells-shared/utils/request')
const UnprocessableEntityError = require('five-bells-shared').UnprocessableEntityError
const UnmetConditionError = require('five-bells-shared').UnmetConditionError
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
      //router.get('/payments/:id', passport.authenticate(['basic'], { session: false }), this.getResource)
      router.put('/payments/:id', Payment.createBodyParser(), self.putResource)
      //router.put('/payments/:id/fulfillment', Model.createBodyParser(), this.putFulfillmentResource)
    }

    static * getHistory () {
      const self = this
      // TODO pagination
      const payments = yield Payment.findAll({
        where: {
          $or: [
            {source_user: self.req.user.id},
            {destination_user: self.req.user.id},
            {destination_account: self.req.user.username}
          ]
        }
      })

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

      const item = yield Payment.findById(this.params.id)

      if (!item) {
        this.status = 404
        return
      }

      this.body = item.getDataExternal()
    }

    /*static async getHistory () {
      let userId = this.params.userId
      // TODO
      // request.validateUriParameter('id', id, 'Uuid')
      userId = userId.toLowerCase()

      // TODO only external data
      this.body = yield Payment.findAll({where: {source_user: userId}})
    }*/

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

      let created
      yield db.transaction(function * (transaction) {
        created = yield payment.create({ transaction })
      })

      // TODO cleanup
      const options = {
        recipient: payment.destination_account,
        amount: payment.source_amount,
        username: this.req.user.username,
        password: this.req.user.password
      }

      const transfer = yield ledger.transfer(options)

      log.debug('Ledger transfer payment ID ' + id)

      this.body = payment.getDataExternal()
    }
  }
}
