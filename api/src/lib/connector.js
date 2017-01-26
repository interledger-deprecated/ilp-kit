"use strict"

const request = require('superagent')
const co = require('co')
const connector = require('ilp-connector')
const Log = require('./log')
const Config = require('./config')
const Utils = require('./utils')
const PeerFactory = require('../models/peer')
const getToken = require('ilp-plugin-virtual/src/util/token').token

const currencies = {
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'CNY': '¥',
  'JPY': '¥',
  'CAD': '$',
  'AUD': '$'
}

module.exports = class Conncetor {
  static constitute() { return [ Config, PeerFactory, Utils, Log ] }
  constructor(config, Peer, utils, log) {
    this.config = config.data
    this.utils = utils
    this.Peer = Peer
    this.log = log('connector')
    this.peers = {}
    this.instance = connector
  }

  * start() {
    const self = this

    this.log.info('Waiting for the ledger...')

    yield this.waitForLedger()

    this.log.info('Starting the connector...')

    connector.listen()

    // Get the peers from the database
    const peers = yield self.Peer.findAll()

    // TODO wait a bit before adding peers (until the below issue is resolved)
    // https://github.com/interledgerjs/ilp-connector/issues/294
    setTimeout(co.wrap(function *() {
      for (const peer of peers) {
        try {
          yield self.connectPeer(peer)
        } catch (e) {
          self.log.err("Couldn't add the peer to the connector", e)
        }
      }
    }), 5000)
  }

  * waitForLedger() {
    const port = process.env.CLIENT_PORT
    const ledgerPublicPath = this.config.getIn(['ledger', 'public_uri'])

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

  * getPeerInfo(peer) {
    const peerInfo = this.peers[peer.id]

    // Already have the info
    if (peerInfo.publicKey) return peerInfo

    // Get the host publicKey
    const hostInfo = yield this.utils.hostLookup('https://' + peer.hostname)

    if (!hostInfo) return

    const publicKey = hostInfo.publicKey
    const token = getToken(this.config.getIn(['connector', 'ed25519_secret_key']), publicKey)

    this.peers[peer.id] = {
      publicKey,
      rpcUri: hostInfo.peersRpcUri,
      ledgerName: 'peer.' + token.substring(0, 5) + '.' + peer.currency.toLowerCase() + '.',
      online: peerInfo ? peerInfo.online : false
    }

    return this.peers[peer.id]
  }

  * connectPeer(peer) {
    if (!this.peers[peer.id]) {
      this.peers[peer.id] = {
        online: false
      }
    }

    // Skip if already connected
    if (this.peers[peer.id].online) return

    // Get host info
    const hostInfo = yield this.getPeerInfo(peer)

    // Couldn't get the host info (service might not be responding)
    if (!hostInfo.publicKey) return

    let promise

    try {
      promise = connector.addPlugin(hostInfo.ledgerName, {
        currency: peer.currency,
        plugin: 'ilp-plugin-virtual',
        store: true,
        options: {
          name: peer.hostname,
          secret: this.config.getIn(['connector', 'ed25519_secret_key']),
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
            connectors: [{
              id: hostInfo.publicKey,
              name: hostInfo.publicKey,
              connector: hostInfo.ledgerName + hostInfo.publicKey
            }]
          }
        }
      })

      this.peers[peer.id].online = true
    } catch (e) {
      throw e
    }

    return promise
  }

  * removePeer(peer) {
    const peerInfo = this.peers[peer.id]

    if (!peerInfo || !peerInfo.online) return

    try {
      yield connector.removePlugin(peerInfo.ledgerName)
    } catch (e) {
      this.log.err("Couldn't remove the peer from the connector", e)
    }

    delete this.peers[peer.id]
  }

  * getPeer(peer) {
    try {
      yield this.connectPeer(peer)
    } catch (e) {
      // That's fine, we'll return an offline state
    }

    const peerInfo = this.peers[peer.id]
    const online = peerInfo && peerInfo.online

    return {
      online,
      balance: online && (yield connector.getPlugin(peerInfo.ledgerName).getBalance())
    }
  }

  * rpc(prefix, method, params) {
    const plugin = connector.getPlugin(prefix)

    return plugin.receive(method, params)
  }
}
