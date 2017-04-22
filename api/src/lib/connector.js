'use strict'

const request = require('superagent')
const co = require('co')
const connector = require('ilp-connector')
const Log = require('./log')
const Config = require('./config')
const Utils = require('./utils')
const PeerFactory = require('../models/peer')
const SettlementMethodFactory = require('../models/settlement_method')
const { generatePrefix } = require('ilp-plugin-virtual')

const InvalidBodyError = require('../errors/invalid-body-error')

module.exports = class Conncetor {
  static constitute () { return [ Config, PeerFactory, Utils, Log, SettlementMethodFactory ] }
  constructor (config, Peer, utils, log, SettlementMethod) {
    this.config = config
    this.utils = utils
    this.Peer = Peer
    this.SettlementMethod = SettlementMethod
    this.log = log('connector')
    this.peers = {}
    this.instance = connector
  }

  * start () {
    const self = this

    this.log.info('Waiting for the ledger...')

    yield this.waitForLedger()

    this.log.info('Starting the connector...')

    connector.listen()

    // Get the peers from the database
    const peers = yield self.Peer.findAll()

    // TODO wait a bit before adding peers (until the below issue is resolved)
    // https://github.com/interledgerjs/ilp-connector/issues/294
    setTimeout(co.wrap(function * () {
      for (const peer of peers) {
        try {
          yield self.connectPeer(peer)
        } catch (e) {
          self.log.err("Couldn't add the peer to the connector", e)
        }
      }
    }), 5000)
  }

  * waitForLedger () {
    const port = process.env.CLIENT_PORT
    const ledgerPublicPath = this.config.data.getIn(['ledger', 'public_uri'])

    return new Promise(resolve => {
      const interval = setInterval(() => {
        request.get('0.0.0.0:' + port + '/' + ledgerPublicPath).end(err => {
          if (!err) {
            clearInterval(interval)
            resolve()
          }
        })
      }, 2000)
    })
  }

  * getPeerInfo (peer) {
    const peerInfo = this.peers[peer.destination]

    // Already have the info
    if (peerInfo && peerInfo.publicKey) return peerInfo

    // Get the host publicKey
    const hostInfo = yield this.utils.hostLookup('https://' + peer.hostname)

    let publicKey
    let rpcUri
    let ledgerName
    if (hostInfo.publicKey) {
      publicKey = hostInfo.publicKey
      rpcUri = hostInfo.peersRpcUri

      // this calls the function in ilp-plugin-virtual src/utils/token.js, which looks like:
      // const prefix = ({ secretKey, peerPublicKey, currencyScale, currencyCode }) => {
      ledgerName = generatePrefix({
        secretKey: this.config.data.getIn(['connector', 'ed25519_secret_key']),
        peerPublicKey: publicKey,
        currencyCode: peer.currencyCode,
        currencyScale: peer.currencyScale || PeerFactory.DEFAULT_CURRENCY_SCALE
      })
    }

    this.peers[peer.destination] = {
      publicKey,
      rpcUri,
      ledgerName,
      online: peerInfo ? peerInfo.online : false
    }

    return this.peers[peer.destination]
  }

  * connectPeer (peer) {
    const self = this

    // Skip if already connected
    if (this.peers[peer.destination] && this.peers[peer.destination].online) return

    // Get host info
    const hostInfo = yield this.getPeerInfo(peer)

    try {
      let options = {
        name: peer.hostname,
        secret: this.config.data.getIn(['connector', 'ed25519_secret_key']),
        peerPublicKey: hostInfo.publicKey,
        prefix: hostInfo.ledgerName,
        rpcUri: hostInfo.rpcUri,
        maxBalance: '' + peer.limit,
        currencyCode: peer.currencyCode,
        currencyScale: peer.currencyScale || PeerFactory.DEFAULT_CURRENCY_SCALE,
        info: {
          connectors: [hostInfo.ledgerName + hostInfo.publicKey]
        }
      }
      yield connector.addPlugin(hostInfo.ledgerName, {
        currency: options.currencyCode, // connectors have this option to contradict the ledgerInfo's currencyCode, but we don't use that.
        plugin: 'ilp-plugin-virtual',
        store: true,
        options
      })
    } catch (e) {
      // if adding the plugin failed, then remove to make sure it doesn't
      // keep a bad plugin in the table. If removePlugin fails because the
      // plugin was never added, just perform a no-op.
      yield (connector.removePlugin(hostInfo.ledgerName)
        .catch(() => {}))

      if (e.message.indexOf('No rate available') > -1) {
        throw new InvalidBodyError('Unsupported currency')
      }
      throw e
    }

    const plugin = connector.getPlugin(hostInfo.ledgerName)

    try {
      yield plugin.getLimit()

      this.peers[peer.destination].online = true
    } catch (e) {
      // Not connected. The other side hasn't peered with this kit
      this.log.info("Can't get the peer limit")
    }

    plugin.on('incoming_message', co.wrap(function * (message) {
      if (message.data.method !== 'settlement_methods_request') return

      const peerStatus = yield self.getPeer(peer)

      if (!peerStatus) return

      // Settlement Methods
      yield plugin.sendMessage({
        from: message.to,
        to: message.from,
        ledger: message.ledger,
        data: {
          method: 'settlement_methods_response',
          settlement_methods: yield self.getSelfSettlementMethods(peer.destination, peerStatus.balance)
        }
      })
    }))
  }

  * getSelfSettlementMethods (destination, amount) {
    // TODO:PERFORMANCE don't call this on every request
    const dbSettlementMethods = yield this.SettlementMethod.findAll({ where: { enabled: true } })
    return dbSettlementMethods.map(settlementMethod => {
      let uri

      if (destination) {
        uri = settlementMethod.type === 'custom'
          ? `${settlementMethod.uri}?destination=${destination}`
          : this.config.data.get('client_host') + '/settle/' + settlementMethod.type + '/' + destination + '?amount=' + Math.max(amount, 0)
      } else {
        uri = settlementMethod.uri
      }

      return {
        id: settlementMethod.id,
        name: settlementMethod.name,
        type: settlementMethod.type,
        description: settlementMethod.description,
        uri,
        logo: settlementMethod.logoUrl
      }
    })
  }

  * removePeer (peer) {
    const peerInfo = this.peers[peer.destination]

    if (!peerInfo || !peerInfo.online) return

    try {
      yield connector.removePlugin(peerInfo.ledgerName)
    } catch (e) {
      this.log.err("Couldn't remove the peer from the connector", e)
    }

    delete this.peers[peer.destination]
  }

  * getPeer (peer) {
    try {
      yield this.connectPeer(peer)
    } catch (e) {
      // That's fine, we'll return an offline state
    }

    const peerInfo = this.peers[peer.destination]

    if (!peerInfo || !peerInfo.ledgerName) return

    const online = peerInfo.online
    const plugin = connector.getPlugin(peerInfo.ledgerName)

    const balance = online && (yield plugin.getBalance())
    const minBalance = online && (yield plugin.getLimit())

    return {
      online,
      balance,
      minBalance: minBalance || 0
    }
  }

  * getSettlementMethods (peer) {
    const peerInfo = this.peers[peer.destination]
    const plugin = connector.getPlugin(peerInfo.ledgerName)

    if (!peerInfo.online) return Promise.reject(new Error('Peer not online'))

    const promise = new Promise(resolve => {
      const handler = message => {
        if (message.data.method !== 'settlement_methods_response') return

        plugin.removeListener('incoming_message', handler)

        resolve(message.data.settlement_methods)
      }

      plugin.on('incoming_message', handler)
    })

    yield plugin.sendMessage({
      from: peerInfo.ledgerName + this.config.data.getIn(['connector', 'public_key']),
      to: peerInfo.ledgerName + peerInfo.publicKey,
      ledger: peerInfo.ledgerName,
      data: {
        method: 'settlement_methods_request'
      }
    })

    return promise
  }

  getPlugin (prefix) {
    return connector.getPlugin(prefix)
  }
}
