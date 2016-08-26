"use strict"

module.exports = PaymentsControllerFactory

const _ = require('lodash')
const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const SPSP = require('../lib/spsp')
const Config = require('../lib/config')
const Utils = require('../lib/utils')
const PaymentFactory = require('../models/payment')
const InvalidLedgerAccountError = require('../errors/invalid-ledger-account-error')
const LedgerInsufficientFundsError = require('../errors/ledger-insufficient-funds-error')

PaymentsControllerFactory.constitute = [Auth, PaymentFactory, Log, Ledger, Config, Utils, SPSP]
function PaymentsControllerFactory (Auth, Payment, log, ledger, config, utils, spsp) {
  log = log('payments')

  return class PaymentsController {
    static init(router) {
      router.get('/payments', Auth.checkAuth, this.getHistory)
      router.post('/payments/quote', Auth.checkAuth, this.quote)
      router.put('/payments/:id', Auth.checkAuth, Payment.createBodyParser(), this.putResource)

      router.get('/receivers/:username', this.getReceiver)
      router.post('/receivers/:username', this.postReceiver)
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
     *          "source_account": "https://wallet.example/ledger/accounts/alice",
     *          "destination_user": 2,
     *          "destination_account": "https://wallet.example/ledger/accounts/bob",
     *          "transfers": "https://wallet.example/ledger/transfers/3d4c9c8e-204a-4213-9e91-88b64dad8604",
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
     *          "source_account": "https://wallet.example/ledger/accounts/alice",
     *          "destination_user": 2,
     *          "destination_account": "https://wallet.example/ledger/accounts/bob",
     *          "transfers": "https://wallet.example/ledger/transfers/d1fa49d3-c955-4833-803a-df0c43eab044",
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
      const page = this.query.page
      const limit = this.query.limit

      const payments = yield Payment.getUserPayments(this.req.user, page, limit)

      this.body = {
        list: payments.rows,
        totalPages: Math.ceil(payments.count / limit)
      }
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
     * @apiParam {String} destination_account destination account
     * @apiParam {String} source_amount source amount
     * @apiParam {String} destination_amount destination amount
     * @apiParam {String} source_memo memo for the source
     * @apiParam {String} destination_memo memo for the destination
     * @apiParam {String} message text message for the destination
     * @apiParam {String} quote quote
     *
     * @apiExample {shell} Make a payment with the destination_amount
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "destination_account": "bob@wallet.example",
     *        "destination_amount": "1"
     *    }'
     *    https://wallet.example/payments/9efa70ec-08b9-11e6-b512-3e1d05defe78
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     */

    // TODO handle payment creation. Shouldn't rely on notification service
    static * putResource() {
      const _this = this

      let id = _this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()
      let payment = this.body

      payment.id = id

      payment.source_user = this.req.user.id

      const destination = yield utils.parseDestination({
        destination: payment.destination
      })

      // TODO fill the destination_user
      const options = {
        sourceAmount: payment.sourceAmount,
        destination: destination,
        destinationAmount: payment.destinationAmount,
        quote: payment,
        source_memo: payment.sourceMemo,
        destination_memo: payment.destinationMemo,
        message: payment.message,
        username: this.req.user.username,
        password: this.req.user.password
      }

      if (payment.destinationMemo) {
        payment.destinationMemo.message = payment.message
      } else {
        payment.destinationMemo = {message: payment.message}
      }

      // Try doing the ledger transaction
      let transfer

      try {
        // transfer = yield ledger.transfer(options)
        console.log(yield spsp.pay({
          sourceAmount: payment.sourceAmount,
          destinationAmount: payment.destinationAmount,
          destinationAccount: payment.destinationAccount,
          destinationMemo: payment.destinationMemo,
          expiresAt: payment.expiresAt,
          executionCondition: payment.executionCondition,
          connectorAccount: payment.connectorAccount,
        }))
        return;

        // Store the payment
        let dbPayment = new Payment()
        dbPayment.setDataExternal({
          transfers: transfer.id,
          message: payment.message,
          status: 'pending'
        })
        dbPayment.save()

        log.debug('Ledger transfer payment ID ' + id)
      } catch (e) {
        if (e && e.response) {
          let error = JSON.parse(e.response.error)

          if (error.id === 'UnprocessableEntityError') {
            throw new InvalidLedgerAccountError(error.message)
          } else if (error.id === 'InsufficientFundsError') {
            throw new LedgerInsufficientFundsError(error.message)
          } else {
            throw e
          }
        } else {
          throw e
        }
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
     * @apiParam {String} destination destination
     * @apiParam {String} source_amount source amount
     * @apiParam {String} destination_amount destination amount
     *
     * @apiExample {shell} Request a quote
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "destination": "bob@wallet.example",
     *        "destination_amount": "10"
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

      // Local quote
      if (destination.type === 'local') {
        const amount = this.body.source_amount || this.body.destination_amount

        this.body = {
          sourceAmount: amount,
          destinationAmount: amount
        }

        return
      }

      // Interledger quote
      this.body = yield spsp.quote({
        destination: destination,
        sourceAmount: this.body.source_amount,
        destinationAmount: this.body.destination_amount
      })
    }

    /**
     * @api {POST} /receivers/:username/payments Prepare a payment
     * @apiName PreparePayment
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription Prepare a payment
     *
     * @apiExample {shell} Prepare a payment
     *    curl -X POST -d
     *    '{
     *        "amount": 98,
     *    }'
     *    https://wallet.example/receivers/alice/payments
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "packet": {
     *        "amount": "98",
     *        "account": "wallet.alice",
     *        "data": {
     *          "expires_at": "2016-08-22T18:14:27.783Z",
     *          "request_id": "ed1edd4d-1d24-4c1f-9a28-dc0fa229ba84"
     *        }
     *      },
     *      "condition": "cc:0:3:Jbe1_sdvD0rlzYdkLZcfuftTLKpyscZ2U8zj_6Oafjw:32"
     *    }
     */

    // TODO:PERFORMANCE Expire pending payments (remove from db)
    static * getReceiver() {
      this.body = yield spsp.createRequest(this.body.amount)

      console.log('get', this.body);
    }

    static * postReceiver() {
      const paymentParams = yield spsp.createRequest(this.body.amount)

      console.log('post', paymentParams);

      const paymentObj = {
        state: 'pending',
        message: this.body.memo,
        source_account: this.body.sender_identifier
      }

      // Create the payment object
      const payment = new Payment()
      payment.setDataExternal(paymentObj)

      try {
        yield payment.create()
      } catch (e) {
        console.log('payments:299', 'woops', e)
        // TODO handle
      }
    }
  }
}
