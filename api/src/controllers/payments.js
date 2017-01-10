"use strict"

module.exports = PaymentsControllerFactory

const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const SPSP = require('../lib/spsp')
const Config = require('../lib/config')
const Socket = require('../lib/socket')
const Pay = require('../lib/pay')
const Utils = require('../lib/utils')
const UserFactory = require('../models/user')
const PaymentFactory = require('../models/payment')
const InsufficientFundsError = require('../errors/ledger-insufficient-funds-error')
const InvalidBodyError = require('../errors/invalid-body-error')
const ServerError = require('../errors/server-error')
const NoQuote = require('../errors/no-quote-error')

PaymentsControllerFactory.constitute = [Auth, PaymentFactory, Log, Ledger, Config, Utils, SPSP, Socket, UserFactory, Pay]
function PaymentsControllerFactory (Auth, Payment, log, ledger, config, utils, spsp, socket, User, pay) {
  log = log('payments')

  return class PaymentsController {
    static init(router) {
      router.get('/payments', Auth.checkAuth, this.getHistory)
      router.get('/payments/transfers/:timeSlot', Auth.checkAuth, this.getTransfers)
      router.post('/payments/quote', Auth.checkAuth, this.quote)
      router.put('/payments/:id', Auth.checkAuth, Payment.createBodyParser(), this.putResource)

      router.post('/receivers/:username', this.setup)

      router.get('/payments/stats', Auth.checkAuth, this.getStats)
    }

    /**
     * @api {get} /payments User payments history
     * @apiName GetPayments
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription Get user payments history
     *
     * @apiParam {String} page Current page number
     * @apiParam {String} limit Number of payments
     *
     * @apiExample {shell} Get last 2 payments
     *    curl -X GET -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/payments?page=1&limit=2
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "list": [
     *        {
     *          "id": "15a3cbb8-d0f3-410e-8a59-14e8dee14abd",
     *          "source_user": 1,
		 *          "source_identifier": "alice@wallet.example"
     *          "destination_user": 2,
     *          "destination_identifier": "bob@wallet.example",
     *          "transfer": "https://wallet.example/ledger/transfers/3d4c9c8e-204a-4213-9e91-88b64dad8604",
     *          "state": null,
     *          "source_amount": "12",
     *          "destination_amount": "12",
     *          "created_at": "2016-04-19T20:18:18.040Z",
     *          "completed_at": null,
     *          "updated_at": "2016-04-19T20:18:18.040Z",
     *          "sourceUserUsername": "alice",
     *          "destinationUserUsername": "bob"
     *        },
     *        {
     *          "id": "e1d3c588-807c-4d4f-b25c-61842b5ead6d",
     *          "source_user": 1,
		 *          "source_identifier": "alice@wallet.example"
     *          "destination_user": 2,
     *          "destination_identifier": "bob@wallet.example",
     *          "transfer": "https://wallet.example/ledger/transfers/d1fa49d3-c955-4833-803a-df0c43eab044",
     *          "state": null,
     *          "source_amount": "1",
     *          "destination_amount": "1",
     *          "created_at": "2016-04-19T20:15:57.055Z",
     *          "completed_at": null,
     *          "updated_at": "2016-04-19T20:15:57.055Z",
     *          "sourceUserUsername": "alice",
     *          "destinationUserUsername": "bob"
     *        }
     *      ],
     *      "totalPages": 5
     *    }
     */
    static * getHistory() {
      const page = this.query.page || 1
      const limit = this.query.limit || 10

      const payments = yield Payment.getUserPayments(this.req.user, page, limit)

      this.body = {
        list: payments.list,
        totalPages: Math.ceil(payments.count / limit)
      }
    }

    // TODO document this
    static * getTransfers() {
      const timeSlot = this.params.timeSlot
      const sourceIdentifier = this.query.sourceIdentifier
      const destinationIdentifier = this.query.destinationIdentifier
      const message = this.query.message

      if (sourceIdentifier !== this.req.user.identifier && destinationIdentifier !== this.req.user.identifier) {
        // TODO throw an exception
        return this.status = 404
      }

      this.body = yield Payment.getTransfers({
        sourceIdentifier, destinationIdentifier, timeSlot, message
      })
    }

    /**
     * @api {put} /payments/:id Make payment
     * @apiName PutPayments
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription Make payment
     *
     * @apiParam {String} id generated payment uuid
     * @apiParam {String} destination destination
     * @apiParam {String} sourceAmount source amount
     * @apiParam {String} destinationAmount destination amount
     * @apiParam {String} message text message for the destination
     *
     * @apiExample {shell} Make a payment
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "destination": "bob@wallet.example",
     *        "sourceAmount": "5",
     *        "destinationAmount": "5",
     *        "message": "Some money for you!"
     *    }'
     *    https://wallet.example/payments/9efa70ec-08b9-11e6-b512-3e1d05defe78
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "id": "a36e3447-8ca5-4bc4-a586-7769e3dea63a"
     *      "destination": "bob@wallet.example",
     *      "sourceAmount": "5",
     *      "destinationAmount": "5",
     *      "message": "Some money for you!",
     *    }
     */

    // TODO don't allow payments to self
    static * putResource() {
      const id = this.params.id && this.params.id.toLowerCase()
      const payment = this.body

      try {
        request.validateUriParameter('id', id, 'Uuid')
        request.validateBody(this, 'Payment')
      } catch (e) {
        // TODO more info on what exactly is wrong
        throw new InvalidBodyError()
      }

      try {
        yield pay.pay({
          source: this.req.user.getDataExternal(),
          destination: payment.destination,
          sourceAmount: payment.sourceAmount,
          destinationAmount: payment.destinationAmount,
          message: payment.message
        })
      } catch (e) {
        console.error(e)

        throw new ServerError()
      }

      // TODO should be something more meaningful
      this.status = 200
    }

    /**
     * @api {POST} /payments/quote Request a quote
     * @apiName Quote
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription Request a quote
     *
     * @apiParam {String} destination destination (email or a username)
     * @apiParam {String} sourceAmount source amount (optional, used if destinationAmount is not provided)
     * @apiParam {String} destinationAmount destination amount (optional, used if sourceAmount is not provided)
     *
     * @apiExample {shell} Request a quote
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "destination": "bob@wallet.example",
     *        "destinationAmount": "10"
     *    }'
     *    https://wallet.example/payments/quote
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "sourceAmount": "10",
     *      "destinationAmount": "10"
     *    }
     */

    // TODO handle not supplied params
    static * quote() {
      const destination = yield utils.parseDestination({
        destination: this.body.destination
      })

      try {
        this.body = yield spsp.quote({
          source: this.req.user,
          destination: destination,
          sourceAmount: this.body.sourceAmount,
          destinationAmount: this.body.destinationAmount
        })
      } catch (e) {
        console.error(e)
        throw new NoQuote('No quote for a specified destination/amount has been found')
      }
    }

    /**
     * @api {POST} /receivers/:username Setup a payment
     * @apiName Setup
     * @apiGroup Receiver
     * @apiVersion 1.0.0
     *
     * @apiDescription Setup a payment
     *
     * @apiParam {String} amount destination amount
     * @apiParam {String} source_identifier sender identifier
     * @apiParam {String} memo memo
     *
     * @apiExample {shell} Setup a payment
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "amount": "10",
     *        "source_identifier": "alice@wallet1.example"
     *        "memo": "Some money for you!"
     *    }'
     *    https://wallet2.example/payments/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "address": "wallet2.alice.ae09e9c0-c4f9-423f-91de-fa1733640b2f",
     *      "amount": "10.00",
     *      "expires_at": "2016-09-06T22:47:01.668Z",
     *      "condition": "cc:0:3:XcJRQrVJQKsXrXnpHIk1Nm7PBm5JfnFgmd8ocsexjO4:32"
     *    }
     */
    static * setup() {
      const sourceIdentifier = this.body.source_identifier
      const name = this.body.sender_name
      const image_url = this.body.sender_image_url
      const memo = this.body.memo
      const destinationAmount = this.body.amount

      if (!destinationAmount) throw new InvalidBodyError('destinationAmount is missing')

      // Get the user from the db. We need the id in the payment
      // TODO cache
      const destinationUser = yield User.findOne({
        where: {username: this.params.username}
      })

      // Requested user doesn't exist
      if (!destinationUser) {
        return this.status = 404
      }

      const paymentParams = yield spsp.createRequest(destinationUser, destinationAmount)

      const paymentObj = {
        state: 'pending',
        source_name: name,
        source_image_url: image_url,
        source_identifier: sourceIdentifier,
        destination_user: destinationUser.id,
        destination_identifier: utils.getWebfingerAddress(destinationUser.username),
        destination_amount: parseFloat(destinationAmount),
        message: memo || null,
        execution_condition: paymentParams.condition
      }

      // Create the payment object
      const payment = new Payment()
      payment.setDataExternal(paymentObj)

      try {
        yield payment.create()

        this.body = paymentParams
      } catch (e) {
        console.log('payments:299', 'woops', e)
        // TODO handle
      }
    }

    static * getStats() {
      this.body = yield Payment.getUserStats(this.req.user)
    }
  }
}
