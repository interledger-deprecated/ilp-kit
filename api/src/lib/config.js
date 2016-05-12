"use strict"

const Config = require('five-bells-shared').Config
const envPrefix = 'api'
const crypto = require('crypto')

module.exports = class WalletConfig {
  constructor () {
    let localConfig = {}
    localConfig.ledger = {
      uri: Config.getEnv(envPrefix, 'LEDGER_URI') || 'http://localhost:3001',
      public_uri: Config.getEnv(envPrefix, 'LEDGER_PUBLIC_URI') || Config.getEnv(envPrefix, 'LEDGER_URI') || 'http://localhost:3001',
      admin: {
        name: Config.getEnv(envPrefix, 'LEDGER_ADMIN_NAME'),
        pass: Config.getEnv(envPrefix, 'LEDGER_ADMIN_PASS')
      }
    }

    // Google Analytics / Mixpanel tracking
    localConfig.track = {
      ga: Config.getEnv(envPrefix, 'TRACK_GA'),
      mixpanel: Config.getEnv(envPrefix, 'TRACK_MIXPANEL')
    }

    // Secrets
    localConfig.sessionSecret = WalletConfig.generateSecret('session').toString('base64')
    localConfig.conditionSecret = WalletConfig.generateSecret('condition')

    // Github
    localConfig.github = {
      client_id: Config.getEnv(envPrefix, 'GITHUB_CLIENT_ID'),
      client_secret: Config.getEnv(envPrefix, 'GITHUB_CLIENT_SECRET'),
      secret: WalletConfig.generateSecret('oauth:github')
    }

    localConfig.reload = Config.getEnv(envPrefix, 'RELOAD')

    if (!localConfig.sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No ' + envPrefix.toUpperCase + 'SESSION_SECRET provided.')
      }
      localConfig.sessionSecret = 'dev'
    }

    this.data = Config.loadConfig(envPrefix, localConfig)
  }

  static generateSecret(text) {
    return crypto.createHmac('sha256', Config.getEnv(envPrefix, 'SECRET')).update(text).digest()
  }
}
