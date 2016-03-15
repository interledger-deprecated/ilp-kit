"use strict"

const Config = require('five-bells-shared').Config
const ledgerPrefix = 'ledger'
const envPrefix = 'api'

module.exports = class WalletConfig {
  constructor () {
    let localConfig = {}
    localConfig.ledger = {
      uri: Config.getEnv(envPrefix, 'LEDGER_URI') || 'http://localhost:3001',
      public_uri: Config.getEnv(envPrefix, 'LEDGER_PUBLIC_URI') || Config.getEnv(envPrefix, 'LEDGER_URI'),
      admin: {
        name: Config.getEnv(envPrefix, 'LEDGER_ADMIN_NAME'),
        pass: Config.getEnv(envPrefix, 'LEDGER_ADMIN_PASS')
      }
    }

    localConfig.sessionSecret = Config.getEnv(envPrefix, 'SESSION_SECRET')

    if (!localConfig.sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No ' + envPrefix.toUpperCase + 'SESSION_SECRET provided.')
      }
      localConfig.sessionSecret = 'dev'
    }

    this.data = Config.loadConfig(envPrefix, localConfig)
  }
}