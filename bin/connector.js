#!/usr/bin/env node
const request = require('superagent')

require('./normalizeEnv')

if (process.env.CONNECTOR_ENABLE) {
  const port = process.env.CLIENT_PORT
  const ledgerPublicPath = process.env.LEDGER_PUBLIC_PATH

  const interval = setInterval(() => {
    // Wait for the ledger and the proxy to start
    request.get('0.0.0.0:' + port + '/' + ledgerPublicPath).end((err) => {
      if (!err) {
        clearInterval(interval)

        require('ilp-connector/src/index.js').listen()
      }
    })
  }, 2000)
}
