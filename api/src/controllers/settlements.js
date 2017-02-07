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
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

SettlementsControllerFactory.constitute = [Auth, Config, Log, SettlementFactory, SettlementMethodFactory, PeerFactory, Connector, Paypal]
function SettlementsControllerFactory(auth, config, log, Settlement, SettlementMethod, Peer, connector, paypal) {
  log = log('settlements')

  return class SettlementsController {
    static init(router) {
      router.post('/settlements/:destination', auth.checkAuth, this.checkAdmin, this.custom)

      // Public
      router.post('/settlements/:destination/paypal', this.paypal)
      router.get('/settlements/:destination/paypal/execute', this.paypalExecute)
      router.get('/settlements/:destination/paypal/cancel', this.paypalCancel)
    }

    // TODO move to auth
    static* checkAdmin(next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      throw new NotFoundError()
    }

    static* settle(params) {
      const peer = params.peer
      const amount = params.amount
      const currency = params.currency
      const prefix = `settlement.${uuid()}.`

      // Add the plugin to the connector
      yield connector.instance.addPlugin(prefix, {
        plugin: 'ilp-plugin-settlement-adapter',
        currency,
        options: {
          prefix,
          currency,
          amount,
          destination: connector.peers[peer.id].ledgerName + connector.peers[peer.id].publicKey,
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
      settlement.peer_id = peer.id
      settlement.amount = amount
      settlement.currency = currency

      return settlement.save()
    }

    static* custom() {
      const destination = this.params.destination

      // TODO:BEFORE_DEPLOY Validation

      const peer = yield Peer.findOne({ where: { destination } })

      if (!peer) {
        throw new InvalidBodyError('Invalid destination')
      }

      const settlementMethod = yield SettlementMethod.findOne({
        where: { id: this.body.settlement_method }
      })

      if (!settlementMethod) {
        throw new InvalidBodyError('Invalid settlement method')
      }

      return yield SettlementsController.settle({
        peer,
        settlementMethod,
        amount: this.body.amount,
        currency: this.body.currency
      })
    }

    static* paypal() {
      const peer = yield Peer.findOne({ where: { destination: this.params.destination } })

      if (!peer) return this.status = 404

      this.body = {
        approvalLink: yield paypal.createPayment(peer, this.body.amount)
      }
    }

    static* paypalExecute() {
      const peer = yield Peer.findOne({ where: { destination: this.params.destination } })

      if (!peer) {
        // TODO more than a 404?
        throw new NotFoundError('Unknown peer')
      }

      try {
        const payment = yield paypal.executePayment(this.query)

        // Weird
        if (peer.destination !== payment.destination) {
          throw new InvalidBodyError("Payment destination doesn't match the expected destination")
        }

        const settlementMethod = yield SettlementMethod.findOne({ where: { type: 'paypal' } })

        const settlement = yield SettlementsController.settle({
          peer,
          settlementMethod,
          amount: payment.amount,
          // TODO support other currencies
          currency: 'USD'
        })

        // TODO:BEFORE_DEPLOY include the paid amount etc
        this.redirect(`${config.data.get('client_host')}/settle/paypal/${peer.destination}/success?peer=${peer.hostname}&currency=${peer.currency}&amount=${payment.amount}`)
      } catch (e) {
        this.redirect(`${config.data.get('client_host')}/settle/paypal/${peer.destination}/cancel?peer=${peer.hostname}&currency=${peer.currency}&amount=${payment.amount}`)
      }
    }

    static* paypalCancel() {
      const peer = yield Peer.findOne({ where: { destination: this.params.destination } })

      if (!peer) {
        throw new NotFoundError('Unknown peer')
      }

      this.redirect(`${config.data.get('client_host')}/settle/paypal/${peer.destination}/cancel`)
    }
  }
}
