"use strict"

const co = require('co')
const request = require('superagent')
const connector = require('ilp-connector')
const crypto = require('crypto')
const sodium = require('sodium-prebuilt').api
const base64url = require('base64url')
const Config = require('./config')
const Utils = require('./utils')
const PeerFactory = require('../models/peer')

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
  static constitute() { return [ Config, PeerFactory, Utils ] }
  constructor(config, Peer, utils) {
    this.config = config.data
    this.utils = utils
    this.Peer = Peer
  }

  start() {
    const self = this
    const port = process.env.CLIENT_PORT
    const ledgerPublicPath = this.config.getIn(['ledger', 'public_uri'])

    const interval = setInterval(() => {
      // Wait for the ledger and the proxy to start
      request.get('0.0.0.0:' + port + '/' + ledgerPublicPath)
        .end(co.wrap(function *(err) {
          if (!err) {
            clearInterval(interval)

            yield self.listen()
          }
        }))
    }, 2000)
  }

  * listen() {
    const self = this

    // Start the connector
    connector.listen()

    // Add the peers
    const peers = yield this.Peer.findAll()

    peers.forEach(co.wrap(function *(peer) {
      yield self.addPeer(peer)
    }))
  }

  * addPeer(peer) {
    const self = this
    const secret = this.config.get('secret')
    const hostInfo = yield self.utils.hostLookup('https://' + peer.hostname)

    if (!hostInfo) return

    const publicKey = hostInfo.publicKey

    const shared = sodium.crypto_scalarmult(
      sodium.crypto_hash_sha256(base64url.toBuffer(secret)),
      base64url.toBuffer(publicKey)
    )
    const token = base64url(
      crypto.createHmac('sha256', shared)
        .update('token', 'ascii')
        .digest()
    )

    const ledgerName = 'peer.' + token.substring(0, 5) + '.' + peer.currency + '.'

    connector.addPlugin(ledgerName, {
      currency: peer.currency,
      plugin: 'ilp-plugin-virtual',
      store: true,
      options: {
        name: peer.hostname,
        secret: secret,
        peerPublicKey: publicKey,
        prefix: ledgerName,
        broker: peer.broker,
        maxBalance: peer.limit,
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
}
