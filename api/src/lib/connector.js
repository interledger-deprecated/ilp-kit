"use strict"

const request = require('superagent')
const connector = require('ilp-connector')
const Config = require('./config')

module.exports = class Conncetor {
  static constitute() { return [ Config ] }
  constructor(config) {
    this.config = config.data
  }

  start() {
    const port = process.env.CLIENT_PORT
    const ledgerPublicPath = this.config.getIn(['ledger', 'public_uri'])

    const interval = setInterval(() => {
      // Wait for the ledger and the proxy to start
      request.get('0.0.0.0:' + port + '/' + ledgerPublicPath).end((err) => {
        if (!err) {
          clearInterval(interval)

          connector.listen()
        }
      })
    }, 2000)
  }
}
