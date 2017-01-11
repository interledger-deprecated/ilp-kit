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
    const self = this

    // Start the connector
    connector.listen()

    // Add the peers
    const peers = yield self.Peer.findAll()

    // TODO wait a bit before adding peers, until the below issue is resolved
    // https://github.com/interledgerjs/ilp-connector/issues/294
    setTimeout(co.wrap(function *() {
      for (const peer of peers) {
        try {
          yield self.addPeer(peer)
        } catch (e) {
          self.log.err("Couldn't add the peer to the connector", e)
        }
      }
    }), 5000)
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

    return connector.addPlugin(ledgerName, {
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
    if (!this.peers[peer.id]) return

    try {
      yield connector.removePlugin(this.peers[peer.id].ledgerName)
    } catch (e) {
      this.log.err("Couldn't remove the peer from the connector", e)
    }

    delete this.peers[peer.id]
  }

  * getPeerBalance(peer) {
    if (this.peers[peer.id]) return connector.getPlugin(this.peers[peer.id].ledgerName).getBalance()
  }
}
