'use strict'

module.exports = SettlementsControllerFactory

// const PluginPaypal = require('ilp-plugin-paypal')

// const co = require('co')
const uuid = require('uuid4')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const SettlementFactory = require('../models/settlement')
const SettlementMethodFactory = require('../models/settlement_method')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

SettlementsControllerFactory.constitute = [Auth, Config, Log, SettlementFactory, SettlementMethodFactory, PeerFactory, Connector]
function SettlementsControllerFactory(auth, config, log, Settlement, SettlementMethod, Peer, connector) {
  log = log('settlements')

  return class SettlementsController {
    static init(router) {
      router.post('/settlements', auth.checkAuth, this.checkAdmin, this.postResource)

      /*co(function * () {
        yield SettlementsController.setupBuiltins()
      })*/
    }

    // TODO move to auth
    static * checkAdmin(next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      throw new NotFoundError()
    }

    static * postResource() {
      const destination = this.body.destination
      const settlement_method = this.body.settlement_method

      // TODO:BEFORE_DEPLOY Validation

      const peer = yield Peer.findOne({ where: { destination } })

      if (!peer) {
        throw new InvalidBodyError('Invalid destination')
      }

      const settlementMethod = yield SettlementMethod.findOne({ where: { id: settlement_method } })

      if (!settlementMethod) {
        throw new InvalidBodyError('Invalid settlement method')
      }

      const prefix = 'settlement.' + uuid() + '.'
      const currency = this.body.currency
      const amount = this.body.amount

      // Add the plugin to the connector
      yield connector.instance.addPlugin(prefix, {
        plugin: 'ilp-plugin-settlement-adapter',
        currency,
        options: {
          prefix,
          currency,
          amount,
          destination: connector.peers[peer.id].ledgerName + connector.peers[peer.id].publicKey,
          connectors: [prefix + 'connector']
        }
      })

      // Emit a payment that gets routed to destination
      yield connector.instance.getPlugin(prefix).receive()

      // Remove the plugin
      yield connector.instance.removePlugin(prefix)

      const settlement = new Settlement()
      settlement.settlement_method_id = settlementMethod.id
      settlement.peer_id = peer.id
      settlement.amount = amount
      settlement.currency = currency

      this.body = yield settlement.save()
    }

    /*static * setupBuiltins () {
      const methodPaypal = yield SettlementMethod.findOne({ where: { type: 'paypal' } })

      // TODO what if the method is added while the ilp-kit is running
      if (methodPaypal) {
        log.info('Enabling Paypal settlements')

        const pluginPaypal = new PluginPaypal({
          host: 'http://localhost:8080', // TODO:BEFORE_DEPLOY real public host
          port: '8080',
          client_id: methodPaypal.options.clientId,
          secret: methodPaypal.options.secret,
          api: methodPaypal.options.api
        })

        pluginPaypal.connect().catch((e) => {
          console.error(e)
        })
      }
    }*/
  }
}
