"use strict"

const request = require('superagent')
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
  }

  * start() {
    const self = this
    const port = process.env.CLIENT_PORT
    const ledgerPublicPath = this.config.getIn(['ledger', 'public_uri'])

    self.log.info('Waiting for the ledger...')

    yield new Promise((resolve) => {
      const interval = setInterval(() => {
        request.get('0.0.0.0:' + port + '/' + ledgerPublicPath).end(err => {
          if (!err) {
            clearInterval(interval)
            resolve()
          }
        })
      }, 2000)
    })

    self.log.info('Starting the connector...')

    yield self.listen()
  }

  * listen() {
    // Start the connector
    connector.listen()

    // Add the peers
    const peers = yield this.Peer.findAll()

    for (const peer of peers) {
      yield this.addPeer(peer)
    }
  }

  * addPeer(peer) {
    const self = this
    const secret = this.config.getIn(['connector', 'ed25519_secret_key'])
    const hostInfo = yield self.utils.hostLookup('https://' + peer.hostname)

    if (!hostInfo) return

    const publicKey = hostInfo.publicKey

    const token = getToken(this.config.getIn(['connector', 'ed25519_secret_key']), publicKey)
    const ledgerName = 'peer.' + token.substring(0, 5) + '.' + peer.currency.toLowerCase() + '.'

    this.peers[peer.id] = {
      ledgerName,
      publicKey
    }

    yield connector.addPlugin(ledgerName, {
      currency: peer.currency,
      plugin: 'ilp-plugin-virtual',
      store: true,
      options: {
        name: peer.hostname,
        secret: secret,
        peerPublicKey: publicKey,
        prefix: ledgerName,
        broker: peer.broker,
        maxBalance: '' + peer.limit,
        currency: peer.currency,
        info: {
          currencyCode: peer.currency,
          currencySymbol: currencies[peer.currency] || peer.currency,
          precision: 10,
          scale: 10,
          connectors: [{
            id: publicKey,
            name: publicKey,
            connector: ledgerName + publicKey
          }]
        }
      }
    })
  }

  * removePeer(peer) {
    console.log('connector:111', this.peers, peer.id, this.peers[peer.id])
    try {
      yield connector.removePlugin(this.peers[peer.id].ledgerName)
    } catch (e) {
      this.log.err("Couldn't remove the plugin from the connector", e)
    }

    delete this.peers[peer.id]
  }

  * getPeerBalance(peer) {
    return connector.getPlugin(this.peers[peer.id].ledgerName).getBalance()
  }
}
