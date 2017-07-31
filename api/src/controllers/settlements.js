'use strict'

module.exports = SettlementsControllerFactory

// const co = require('co')
const uuid = require('uuid4')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const Paypal = require('../lib/paypal')
const Activity = require('../lib/activity')
const SettlementFactory = require('../models/settlement')
const SettlementMethodFactory = require('../models/settlement_method')
const UserFactory = require('../models/user')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

function SettlementsControllerFactory (deps) {
  const auth = deps(Auth)
  const config = deps(Config)
  const Settlement = deps(SettlementFactory)
  const SettlementMethod = deps(SettlementMethodFactory)
  const User = deps(UserFactory)
  const Peer = deps(PeerFactory)
  const connector = deps(Connector)
  const paypal = deps(Paypal)
  const activity = deps(Activity)

  const getDestination = async function (destination) {
    return (await User.findOne({ where: { destination } })) || Peer.findOne({ where: { destination } })
  }

  return class SettlementsController {
    static init (router) {
      // Public
      router.get('/destinations/:destination', this.getDestination)
      router.post('/settlements/:destination/paypal', this.paypal)
      router.get('/settlements/:destination/paypal/execute', this.paypalExecute)
      router.get('/settlements/:destination/paypal/cancel', this.paypalCancel)

      // User
      router.get('/settlements/:id', auth.checkAuth, this.getResource)

      // Admin
      router.get('/settlements', auth.checkAuth, this.checkAdmin, this.getResources)
      router.post('/settlements/:destination', auth.checkAuth, this.checkAdmin, this.custom)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    /**
     * @api {GET} /destinations/:destination Get destination
     * @apiName GetSettlementDestination
     * @apiGroup Settlement
     * @apiVersion 1.0.0
     *
     * @apiDescription Get all settlement methods
     *
     * @apiParam {int} destination destination
     *
     * @apiExample {shell} Get destination
     *    curl -X GET
     *    https://wallet.example/destinations/813133
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *       "type": "user"
     *    }
     */
    static async getDestination (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) {
        throw new NotFoundError('Invalid destination')
      }

      ctx.body = {
        type: destination.hostname ? 'peer' : 'user',
        hostname: destination.hostname
      }
    }

    static async settle (params) {
      const destination = params.destination
      const amount = params.amount
      const currency = params.currency
      const prefix = `settlement.${uuid()}.`

      let ilpAddress

      if (destination.hostname) {
        ilpAddress = connector.peers[destination.destination].ledgerName + connector.peers[destination.destination].publicKey
      } else {
        ilpAddress = config.data.getIn(['ledger', 'prefix']) + destination.username
      }

      // Add the plugin to the connector
      await connector.instance.addPlugin(prefix, {
        plugin: 'ilp-plugin-settlement-adapter',
        currency,
        options: {
          prefix,
          currency,
          amount,
          destination: ilpAddress,
          connectors: [`${prefix}connector`]
        }
      })

      // Emit a payment that gets routed to destination
      await connector.instance.getPlugin(prefix).receive()

      // Remove the plugin
      await connector.instance.removePlugin(prefix)

      // Store the settlement in the database
      let settlement = new Settlement()
      settlement.settlement_method_id = params.settlementMethod.id

      if (destination.hostname) {
        settlement.peer_id = destination.id
      } else {
        settlement.user_id = destination.id
      }

      settlement.amount = amount
      settlement.currency = currency

      settlement = await settlement.save()

      await activity.processSettlement(settlement)

      return settlement
    }

    /**
     * @api {POST} /settlements/:destination Settle
     * @apiName PostSettle
     * @apiGroup Settlement
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Settle
     *
     * @apiParam {int} destination destination
     *
     * @apiExample {shell} Settle
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -d
     *    '{
     *        "amount": "10",
     *        "currency": "USD",
     *        "settlement_method": "7b4a73b0-19c5-46ed-8905-febeae2b0a05"
     *    }'
     *    https://wallet.example/settlements/813133
     *
     * @apiSuccessExample {json} 204 Response:
     *    HTTP/1.1 204 OK
     */
    static async custom (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      const settlementMethod = await SettlementMethod.findOne({
        where: { id: ctx.body.settlement_method }
      })

      if (!settlementMethod) {
        throw new InvalidBodyError('Invalid settlement method')
      }

      this.body = null

      return SettlementsController.settle({
        destination,
        settlementMethod,
        amount: ctx.body.amount,
        currency: ctx.body.currency
      })
    }

    /**
     * @api {POST} /settlements/:destination/paypal Get Paypal link
     * @apiName PostPaypalLink
     * @apiGroup Settlement
     * @apiVersion 1.0.0
     *
     * @apiDescription Get Paypal link
     *
     * @apiParam {int} destination destination
     *
     * @apiExample {shell} Get destination
     *    curl -X POST
     *    https://wallet.example/settlements/813133/paypal
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *       "approvalLink": "https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-7R410477WT7455126"
     *    }
     */
    static async paypal (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      ctx.body = {
        approvalLink: await paypal.createPayment(destination.destination, ctx.body.amount)
      }
    }

    static async paypalExecute (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      try {
        const payment = await paypal.executePayment(ctx.query)
        // Weird
        if (destination.destination !== payment.destination) {
          // TODO this is caught locally
          throw new InvalidBodyError("Payment destination doesn't match the expected destination")
        }

        const settlementMethod = await SettlementMethod.findOne({ where: { type: 'paypal' } })

        const settlement = await SettlementsController.settle({
          destination,
          settlementMethod,
          amount: payment.amount,
          // TODO support other currencies
          currency: 'USD'
        })

        // TODO:BEFORE_DEPLOY handle destination.hostname, destination.currency for user
        ctx.redirect(`${config.data.get('client_host')}/settlement/${settlement.id}`)
      } catch (e) {
        console.log('settlements:174', e)
        ctx.redirect(`${config.data.get('client_host')}/settlement/cancel`)
      }
    }

    static async paypalCancel (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      ctx.redirect(`${config.data.get('client_host')}/settle/paypal/${destination.destination}/cancel`)
    }

    /**
     * @api {GET} /settlements/:id Get Settlement
     * @apiName GetSettlement
     * @apiGroup Settlement
     * @apiVersion 1.0.0
     *
     * @apiDescription Get Settlement
     *
     * @apiParam {UUID} id settlement id
     *
     * @apiExample {shell} Get destination
     *    curl -X GET
     *    https://wallet.example/settlements/da978aa3-93c1-4899-8507-6888cb4ce8ca
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *        "amount": 110,
     *        "currency": "USD",
     *        "method": "paypal",
     *        "date": "2017-03-16T17:03:02.767Z",
     *        "peer": null,
     *        "user": "alice"
     *    }
     */
    static async getResource (ctx) {
      const settlement = await Settlement.findOne({
        where: { id: ctx.params.id },
        include: [{ all: true }]
      })

      if (!settlement) throw new NotFoundError()

      ctx.body = {
        amount: settlement.amount,
        currency: settlement.currency,
        method: settlement.SettlementMethod.type,
        date: settlement.created_at,
        peer: settlement.Peer && settlement.Peer.hostname,
        user: settlement.User && settlement.User.username
      }
    }

    /**
     * @api {GET} /settlements Get Settlements
     * @apiName GetSettlement
     * @apiGroup Settlement
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Get Settlement
     *
     * @apiParam {string} type settlement type. 'peer' or 'user'
     *
     * @apiExample {shell} Get destination
     *    curl -X GET -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/settlements
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    [
     *       {
     *           "id": "da978aa3-93c1-4899-8507-6888cb4ce8ca",
     *           "amount": 110,
     *           "currency": "USD",
     *           "created_at": "2017-03-16T17:03:02.767Z",
     *           "updated_at": "2017-03-16T17:03:02.767Z",
     *           "peer_id": null,
     *           "user_id": 2,
     *           "settlement_method_id": "7b4a73b0-19c5-46ed-8905-febeae2b0a05",
     *           "Peer": null,
     *           "User": {
     *               "id": 2,
     *               "username": "alice",
     *               "email": "alice@example.com",
     *               "email_verified": true,
     *               "github_id": null,
     *               "destination": "451744",
     *               "profile_picture": "upload_3a252b77b8f4c76f3037d7df30892441_square.jpeg",
     *               "name": "Alice",
     *               "phone": null,
     *               "address1": null,
     *               "address2": null,
     *               "city": null,
     *               "region": null,
     *               "country": null,
     *               "zip_code": null,
     *               "created_at": "2016-12-02T22:27:49.360Z",
     *               "updated_at": "2017-06-02T20:20:29.214Z",
     *               "invite_code": null
     *           },
     *           "SettlementMethod": {
     *               "id": "7b4a73b0-19c5-46ed-8905-febeae2b0a05",
     *               "type": "paypal",
     *               "name": "Paypal",
     *               "logo": null,
     *               "description": null,
     *               "uri": null,
     *               "enabled": true,
     *               "options": {
     *                   "clientId": "...",
     *                   "secret": "...",
     *                   "sandbox": true
     *               },
     *               "created_at": "2017-02-02T19:20:04.190Z",
     *               "updated_at": "2017-03-07T01:48:29.769Z"
     *           },
     *           "ActivityLogs": [
     *               {
     *                   "id": "67407a5e-08df-46e2-b7fe-41b46b067626",
     *                   "stream_id": null,
     *                   "created_at": "2017-03-16T17:03:02.813Z",
     *                   "updated_at": "2017-03-16T17:03:02.813Z",
     *                   "user_id": 2,
     *                   "ActivityLogsItem": {
     *                       "id": 4482,
     *                       "activity_log_id": "67407a5e-08df-46e2-b7fe-41b46b067626",
     *                       "item_type": "settlement",
     *                       "item_id": "da978aa3-93c1-4899-8507-6888cb4ce8ca",
     *                       "created_at": "2017-03-16T17:03:02.847Z",
     *                       "updated_at": "2017-03-16T17:03:02.847Z"
     *                   }
     *               }
     *           ]
     *       }
     *    ]
     */
    // TODO don't return this much stuff
    static async getResources (ctx) {
      const type = ctx.query.type
      let where

      if (type === 'user') {
        where = { user_id: { $not: null } }
      } else if (type === 'peer') {
        where = { peer_id: { $not: null } }
      } else {
        throw new InvalidBodyError('Settlement type is not specified')
      }

      ctx.body = await Settlement.findAll({
        where,
        include: [{ all: true }]
      })
    }
  }
}
