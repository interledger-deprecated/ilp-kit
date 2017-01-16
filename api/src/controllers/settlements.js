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
      router.post('/settlements/:destination', auth.checkAuth, this.checkAdmin, this.custom)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    static async getDestination (ctx) {
      const destination = await getDestination(this.params.destination)

      if (!destination) {
        throw new NotFoundError('Invalid destination')
      }

      this.body = {
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

    static async custom (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      const settlementMethod = await SettlementMethod.findOne({
        where: { id: ctx.body.settlement_method }
      })

      if (!settlementMethod) {
        throw new InvalidBodyError('Invalid settlement method')
      }

      return SettlementsController.settle({
        destination,
        settlementMethod,
        amount: ctx.body.amount,
        currency: ctx.body.currency
      })
    }

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
        ctx.redirect(`${config.data.get('client_uri')}/settlement/${settlement.id}`)
      } catch (e) {
        console.log('settlements:174', e)
        ctx.redirect(`${config.data.get('client_uri')}/settlement/cancel`)
      }
    }

    static async paypalCancel (ctx) {
      const destination = await getDestination(ctx.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      ctx.redirect(`${config.data.get('client_uri')}/settle/paypal/${destination.destination}/cancel`)
    }

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
  }
}
