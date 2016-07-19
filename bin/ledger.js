#!/usr/bin/env node
if (!process.env.API_LEDGER_URI) {
  require('./normalizeEnv')
  require('../node_modules/five-bells-ledger/src/services/app').start()
}
