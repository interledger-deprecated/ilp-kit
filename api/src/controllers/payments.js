'use strict'

module.exports = PaymentsControllerFactory

const Auth = require('../lib/auth')
const SPSP = require('../lib/spsp')
const Pay = require('../lib/pay')
const UserFactory = require('../models/user')
const PaymentFactory = require('../models/payment')
const NotFoundError = require('../errors/not-found-error')
const ServerError = require('../errors/server-error')
const NoQuote = require('../errors/no-quote-error')

function PaymentsControllerFactory (deps) {
  const auth = deps(Auth)
  const Payment = deps(PaymentFactory)
  const spsp = deps(SPSP)
  const User = deps(UserFactory)
  const pay = deps(Pay)

  return class PaymentsController {
    static init (router) {
      router.post('/payments/quote', auth.checkAuth, this.quote)
      router.put('/payments/:id', auth.checkAuth, this.putResource)
      router.get('/payments/stats', auth.checkAuth, this.getStats)

      router.get('/spsp/:username', this.query)
    }

    /**
     * @api {POST} /payments/quote Request a quote
     * @apiName Quote
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription Request a quote
     *
     * @apiParam {String} destination destination webfinger account
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
     *      "id": "406e6682-b18e-4e8b-8235-e88ad16a15a0",
     *      "sourceAmount": "1",
     *      "destinationAmount": "1",
     *      "destinationAccount": "wallet.bob._1nG4HIOEdgsGt03lQnSA6Bqv9Ju55vtA",
     *      "connectorAccount": "wallet.bob._1nG4HIOEdgsGt03lQnSA6Bqv9Ju55vtA",
     *      "sourceExpiryDuration": "10",
     *      "spsp": {
     *        "destination_account": "wallet.bob._1nG4HIOEdgsGt03lQnSA6Bqv9Ju55vtA",
     *        "shared_secret": "1pvx93ZEd8gTGHfiqKhD5w",
     *        "maximum_destination_amount": "18446744073709552000",
     *        "minimum_destination_amount": "1",
     *        "ledger_info": {
     *          "currency_code": "USD",
     *          "currency_scale": 9
     *        },
     *        "receiver_info": {
     *          "name": "",
     *          "image_url": "https://wallet.example/api/users/bob/profilepic",
     *          "identifier": "bob@wallet.example"
     *        }
     *      }
     *    }
     */

    // TODO handle not supplied params
    static async quote (ctx) {
      try {
        ctx.body = await spsp.quote({
          user: ctx.req.user,
          destination: ctx.body.destination,
          sourceAmount: ctx.body.sourceAmount,
          destinationAmount: ctx.body.destinationAmount
        })
      } catch (e) {
        console.error(e)
        throw new NoQuote('No quote for the specified destination/amount has been found')
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
     * @apiParam {String} destination destination
     * @apiParam {String} sourceAmount source amount
     * @apiParam {String} destinationAmount destination amount
     * @apiParam {String} memo text message for the destination
     *
     * @apiExample {shell} Make a payment
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "quote": {QuoteResponse},
     *        "message": "Here's some money for you"
     *    }'
     *    https://wallet.example/payments/9efa70ec-08b9-11e6-b512-3e1d05defe78
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 204 OK
     */

    // TODO don't allow payments to self
    static async putResource (ctx) {
      const quote = ctx.body.quote
      const message = ctx.body.message

      try {
        await pay.pay({ user: ctx.req.user, quote, message })
      } catch (e) {
        console.error(e)

        throw new ServerError()
      }

      ctx.body = null
    }

    /**
     * @api {POST} /spsp/:username SPSP query
     * @apiName Query
     * @apiGroup Payment
     * @apiVersion 1.0.0
     *
     * @apiDescription SPSP Query
     *
     * @apiParam {String} username username
     *
     * @apiExample {shell} SPSP Query
     *    curl -X POST -H "Content-Type: application/json"
     *    https://wallet.example/api/spsp/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *        "destination_account": "wallet.alice.iD4LnxavIqs4CKbwVkelHEluk5VTnH8Vw",
     *        "shared_secret": "dwGaLn1pIrrOmmq6Xk362g",
     *        "maximum_destination_amount": "18446744073709552000",
     *        "minimum_destination_amount": "1",
     *        "ledger_info": {
     *            "currency_code": "USD",
     *            "currency_scale": 9
     *        },
     *        "receiver_info": {
     *            "name": "Alice Jan",
     *            "image_url": "http://wallet.example/api/users/alice/profilepic",
     *            "identifier": "alice@wallet.example"
     *        }
     *    }
     */
    static async query (ctx) {
      const user = await User.findOne({ where: { username: ctx.params.username } })

      if (!user) throw new NotFoundError()

      ctx.body = await spsp.query(user)
    }

    static async getStats (ctx) {
      ctx.body = await Payment.getUserStats(ctx.req.user)
    }
  }
}
