#!/usr/bin/env node
require('./normalizeEnv')

if (process.env.LEDGER_ENABLE) {
  require('five-bells-ledger/src/services/app').start()
}
