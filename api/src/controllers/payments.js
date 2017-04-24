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
     *        "destination": "bob@wallet.example",
     *        "sourceAmount": "5",
     *        "destinationAmount": "5",
     *        "memo": "Some money for you!"
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
     *      "memo": "Some money for you!",
     *    }
     */

    // TODO don't allow payments to self
    static async putResource (ctx) {
      const id = this.params.id && this.params.id.toLowerCase()
      const quote = ctx.body.quote
      const destination = ctx.body.destination
      const message = ctx.body.message

      try {
        await pay.pay({ user: ctx.req.user, quote, destination, message })
      } catch (e) {
        console.error(e)

        throw new ServerError()
      }

      // TODO should be something more meaningful
      ctx.status = 200
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
     *    curl -X POST -H "Content-Type: application/json" -d
     *    '{
     *        "amount": "10",
     *        "source_identifier": "alice@wallet1.example"
     *        "memo": "Some money for you!"
     *    }'
     *    https://wallet2.example/api/receivers/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "address": "wallet2.alice.~ipr.csWIkAxOSfo.3c51a836-6a2a-40b4-8905-a57e9806a1ac",
     *      "amount": "10.00",
     *      "expires_at": "2016-09-06T22:47:01.668Z",
     *      "condition": "cc:0:3:XcJRQrVJQKsXrXnpHIk1Nm7PBm5JfnFgmd8ocsexjO4:32"
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
