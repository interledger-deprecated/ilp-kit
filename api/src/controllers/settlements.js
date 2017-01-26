'use strict'

module.exports = SettlementsControllerFactory

const SettlementPlugin = require('ilp-plugin-settlement-adapter')
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

      const plugin = new SettlementPlugin({
        amount: this.body.amount,
        currency: this.body.currency,
        destination: connector.peers[peer.id].ledgerName
      })

      // TODO:BEFORE_DEPLOY plugin name + settlement id
      const pluginName = 'settlement'

      // Add the plugin to the connector
      yield connector.instance.addPlugin(pluginName, plugin)
      yield connector.instance.getPlugin(pluginName).receive()
      yield connector.instance.removePlugin(pluginName)

      const settlement = new Settlement()
      settlement.settlement_method_id = settlementMethod.id
      settlement.peer_id = peer.id
      settlement.amount = this.body.amount
      settlement.currency = this.body.currency

      this.body = yield settlement.save()
    }
  }
}
