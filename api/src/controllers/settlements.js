'use strict'

module.exports = SettlementsControllerFactory

// const co = require('co')
const uuid = require('uuid4')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const Paypal = require('../lib/paypal')
const SettlementFactory = require('../models/settlement')
const SettlementMethodFactory = require('../models/settlement_method')
const UserFactory = require('../models/user')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

SettlementsControllerFactory.constitute = [Auth, Config, Log, SettlementFactory, SettlementMethodFactory, UserFactory, PeerFactory, Connector, Paypal]
function SettlementsControllerFactory (auth, config, log, Settlement, SettlementMethod, User, Peer, connector, paypal) {
  log = log('settlements')

  const getDestination = function * (destination) {
    return (yield User.findOne({ where: { destination } })) || (yield Peer.findOne({ where: { destination } }))
  }

  return class SettlementsController {
    static init (router) {
      router.post('/settlements/:destination', auth.checkAuth, this.checkAdmin, this.custom)

      // Public
      router.get('/settlements/:destination', this.getDestination)
      router.post('/settlements/:destination/paypal', this.paypal)
      router.get('/settlements/:destination/paypal/execute', this.paypalExecute)
      router.get('/settlements/:destination/paypal/cancel', this.paypalCancel)
    }

    // TODO move to auth
    static * checkAdmin (next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      throw new NotFoundError()
    }

    static * getDestination () {
      const destination = yield getDestination(this.params.destination)

      if (!destination) {
        throw new NotFoundError('Invalid destination')
      }

      this.body = {
        type: destination.hostname ? 'peer' : 'user',
        hostname: destination.hostname
      }
    }

    static * settle (params) {
      const destination = params.destination
      const amount = params.amount
      const currency = params.currency
      const prefix = `settlement.${uuid()}.`

      let ilpAddress

      if (destination.hostname) {
        ilpAddress = connector.peers[destination.id].ledgerName + connector.peers[destination.id].publicKey
      } else {
        ilpAddress = config.data.getIn(['ledger', 'prefix']) + destination.username
      }

      // Add the plugin to the connector
      yield connector.instance.addPlugin(prefix, {
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
      yield connector.instance.getPlugin(prefix).receive()

      // Remove the plugin
      yield connector.instance.removePlugin(prefix)

      // Store the settlement in the database
      const settlement = new Settlement()
      settlement.settlement_method_id = params.settlementMethod.id

      if (destination.hostname) {
        settlement.peer_id = destination.id
      } else {
        settlement.user_id = destination.id
      }

      settlement.amount = amount
      settlement.currency = currency

      return settlement.save()
    }

    static * custom () {
      const destination = yield getDestination(this.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      const settlementMethod = yield SettlementMethod.findOne({
        where: { id: this.body.settlement_method }
      })

      if (!settlementMethod) {
        throw new InvalidBodyError('Invalid settlement method')
      }

      return yield SettlementsController.settle({
        destination,
        settlementMethod,
        amount: this.body.amount,
        currency: this.body.currency
      })
    }

    static * paypal () {
      const destination = yield getDestination(this.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      this.body = {
        approvalLink: yield paypal.createPayment(destination.destination, this.body.amount)
      }
    }

    static * paypalExecute () {
      const destination = yield getDestination(this.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      try {
        const payment = yield paypal.executePayment(this.query)

        // Weird
        if (destination.destination !== payment.destination) {
          // TODO this is caught locally
          throw new InvalidBodyError("Payment destination doesn't match the expected destination")
        }

        const settlementMethod = yield SettlementMethod.findOne({ where: { type: 'paypal' } })

        yield SettlementsController.settle({
          destination,
          settlementMethod,
          amount: payment.amount,
          // TODO support other currencies
          currency: 'USD'
        })

        // TODO:BEFORE_DEPLOY handle destination.hostname, destination.currency for user
        this.redirect(`${config.data.get('client_host')}/settle/paypal/${destination.destination}/success?peer=${destination.hostname}&currency=${destination.currency}&amount=${payment.amount}`)
      } catch (e) {
        this.redirect(`${config.data.get('client_host')}/settle/paypal/${destination.destination}/cancel?peer=${destination.hostname}&currency=${destination.currency}`)
      }
    }

    static * paypalCancel () {
      const destination = yield getDestination(this.params.destination)

      if (!destination) throw new NotFoundError('Invalid destination')

      this.redirect(`${config.data.get('client_host')}/settle/paypal/${destination.destination}/cancel`)
    }
  }
}
