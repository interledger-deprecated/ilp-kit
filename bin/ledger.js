#!/usr/bin/env node
const url = require('url')
const env = process.env

if (env.WALLET_LEDGER_ENABLE) {
  const ledgerUri = url.parse(env.API_LEDGER_URI)
  const ledgerPublicUri = env.API_LEDGER_PUBLIC_URI ? url.parse(env.API_LEDGER_PUBLIC_URI) : ledgerUri

  env.LEDGER_DB_URI = env.LEDGER_DB_URI || env.API_DB_URI + '-ledger'
  env.LEDGER_ADMIN_NAME = env.API_LEDGER_ADMIN_NAME
  env.LEDGER_ADMIN_PASS = env.API_LEDGER_ADMIN_PASS
  env.LEDGER_HOSTNAME = env.LEDGER_HOSTNAME || ledgerUri.hostname
  env.LEDGER_PORT = env.LEDGER_PORT || ledgerUri.port
  env.LEDGER_PUBLIC_PORT = env.LEDGER_PUBLIC_PORT || ledgerPublicUri.port || 80
  env.LEDGER_PUBLIC_PATH = env.LEDGER_PUBLIC_PATH || ledgerPublicUri.path
  env.LEDGER_CURRENCY_CODE = env.LEDGER_CURRENCY_CODE || 'USD'
  env.LEDGER_CURRENCY_SYMBOL = env.LEDGER_CURRENCY_SYMBOL || '$'
  env.LEDGER_PUBLIC_HTTPS = env.LEDGER_PUBLIC_HTTPS || !!env.WALLET_FORCE_HTTPS

  require('../node_modules/five-bells-ledger/src/services/app').start()
}
