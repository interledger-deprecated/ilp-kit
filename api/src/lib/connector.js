"use strict"

const request = require('superagent')
const co = require('co')
const connector = require('ilp-connector')
const Log = require('./log')
const Config = require('./config')
const Utils = require('./utils')
const PeerFactory = require('../models/peer')
const SettlementMethodFactory = require('../models/settlement_method')
const getToken = require('ilp-plugin-virtual/src/util/token').token

const InvalidBodyError = require('../errors/invalid-body-error')

const currencies = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  CAD: '$',
  AUD: '$'
}

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
    let token
    let rpcUri
    let ledgerName
    if (hostInfo.publicKey) {
      publicKey = hostInfo.publicKey
      token = getToken(this.config.data.getIn(['connector', 'ed25519_secret_key']), publicKey)
      rpcUri = hostInfo.peersRpcUri
      ledgerName = 'peer.' + token.substring(0, 5) + '.' + peer.currency.toLowerCase() + '.'
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
      yield connector.addPlugin(hostInfo.ledgerName, {
        currency: peer.currency,
        plugin: 'ilp-plugin-virtual',
        store: true,
        options: {
          name: peer.hostname,
          secret: this.config.data.getIn(['connector', 'ed25519_secret_key']),
          peerPublicKey: hostInfo.publicKey,
          prefix: hostInfo.ledgerName,
          rpcUri: hostInfo.rpcUri,
          maxBalance: '' + peer.limit,
          currency: peer.currency,
          info: {
            currencyCode: peer.currency,
            currencySymbol: currencies[peer.currency] || peer.currency,
            precision: 10,
            scale: 10,
            connectors: [hostInfo.ledgerName + hostInfo.publicKey]
          }
        }
      })
    } catch (e) {
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

    plugin.on('incoming_message', co.wrap(function *(message) {
      if (message.data.method !== 'settlement_methods_request') return

      const peerStatus = yield self.getPeer(peer)

      if (!peerStatus) return

      // Settlement Methods
      // TODO:PERFORMANCE don't call this on every request
      const dbSettlementMethods = yield self.SettlementMethod.findAll({ where: { enabled: true } })
      const settlementMethods = dbSettlementMethods.map((settlementMethod) => {
        const uri = settlementMethod.type === 'custom'
          ? `${settlementMethod.uri}?destination=${peer.destination}`
          : self.config.data.get('client_host') + '/settle/' + settlementMethod.type + '/' + peer.destination + '?amount=' + Math.max(peerStatus.balance, 0)

        return {
          id: settlementMethod.id,
          name: settlementMethod.name,
          description: settlementMethod.description,
          uri,
          logo: settlementMethod.logoUrl
        }
      })

      yield plugin.sendMessage({
        account: message.from,
        from: message.to,
        to: message.from,
        ledger: message.ledger,
        data: {
          method: 'settlement_methods_response',
          settlement_methods: settlementMethods
        }
      })
    }))
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

    if (!peerInfo.online) return Promise.reject()

    const promise = new Promise(resolve => {
      const handler = message => {
        if (message.data.method !== 'settlement_methods_response') return

        plugin.removeListener('incoming_message', handler)

        resolve(message.data.settlement_methods)
      }

      plugin.on('incoming_message', handler)
    })

    yield plugin.sendMessage({
      account: peerInfo.ledgerName + peerInfo.publicKey,
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
