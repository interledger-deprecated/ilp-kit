"use strict"

const co = require('co')
const request = require('superagent')
const connector = require('ilp-connector')
const Config = require('./config')
const PeerFactory = require('../models/peer')

module.exports = class Conncetor {
  static constitute() { return [ Config, PeerFactory ] }
  constructor(config, Peer) {
    this.config = config.data
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
    // Start the connector
    connector.listen()

    // Add the peers
    const peers = yield this.Peer.findAll()

    peers.forEach(peer => {
      //connector.addPlugin()
    })
  }
}
