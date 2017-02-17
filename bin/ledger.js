#!/usr/bin/env node
require('./env').normalizeEnv()

if (process.env.LEDGER_ENABLE) {
  require('five-bells-ledger/src/services/app').start()
}
