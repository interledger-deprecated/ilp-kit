"use strict"

const co = require('co')
const request = require('superagent')
const connector = require('ilp-connector')
const crypto = require('crypto')
const sodium = require('sodium-prebuilt').api
const base64url = require('base64url')
const Log = require('./log')
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
  static constitute() { return [ Config, PeerFactory, Utils, Log ] }
  constructor(config, Peer, utils, log) {
    this.config = config.data
    this.utils = utils
    this.Peer = Peer
    this.log = log('connector')
    this.peerPublicKeys = {}
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

  getToken(publicKey) {
    const secret = this.config.get('secret')

    const shared = sodium.crypto_scalarmult(
      sodium.crypto_hash_sha256(base64url.toBuffer(secret)),
      base64url.toBuffer(publicKey)
    )
    return base64url(
      crypto.createHmac('sha256', shared)
        .update('token', 'ascii')
        .digest()
    )
  }

  * addPeer(peer) {
    const self = this
    const secret = this.config.get('secret')
    const hostInfo = yield self.utils.hostLookup('https://' + peer.hostname)

    if (!hostInfo) return

    const publicKey = hostInfo.publicKey

    const token = this.getToken(hostInfo.publicKey)
    const ledgerName = 'peer.' + token.substring(0, 5) + '.' + peer.currency + '.'

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

    this.peerPublicKeys[peer.id] = publicKey
  }

  * removePeer(peer) {
    const token = this.getToken(this.peerPublicKeys[peer.id])
    const ledgerName = 'peer.' + token.substring(0, 5) + '.' + peer.currency + '.'

    yield connector.removePlugin(ledgerName)

    delete this.peerPublicKeys[peer.id]
  }
}
