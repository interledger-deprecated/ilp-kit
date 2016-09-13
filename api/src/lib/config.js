"use strict"

require('../../../bin/normalizeEnv')

const Config = require('five-bells-shared').Config
const envPrefix = 'api'
const crypto = require('crypto')

module.exports = class WalletConfig {
  constructor () {
    const localConfig = {}
    localConfig.ledger = {
      uri: Config.getEnv(envPrefix, 'LEDGER_URI'),
      public_uri: Config.getEnv(envPrefix, 'LEDGER_PUBLIC_URI') || Config.getEnv(envPrefix, 'LEDGER_URI'),
      admin: {
        name: Config.getEnv(envPrefix, 'LEDGER_ADMIN_NAME'),
        pass: Config.getEnv(envPrefix, 'LEDGER_ADMIN_PASS')
      },
      prefix: Config.getEnv('LEDGER_ILP_PREFIX'),
      currency: {
        code: Config.getEnv('LEDGER_CURRENCY_CODE'),
        symbol: Config.getEnv('LEDGER_CURRENCY_SYMBOL')
      }
    }

    // Google Analytics / Mixpanel tracking
    localConfig.track = {
      ga: Config.getEnv(envPrefix, 'TRACK_GA'),
      mixpanel: Config.getEnv(envPrefix, 'TRACK_MIXPANEL')
    }

    // Secrets
    localConfig.sessionSecret = this.generateSecret('session').toString('base64')
    localConfig.conditionSecret = this.generateSecret('condition')

    // Github
    localConfig.github = {
      client_id: Config.getEnv(envPrefix, 'GITHUB_CLIENT_ID'),
      client_secret: Config.getEnv(envPrefix, 'GITHUB_CLIENT_SECRET'),
      secret: this.generateSecret('oauth:github')
    }

    // Mailgun
    localConfig.mailgun = {
      api_key: Config.getEnv(envPrefix, 'MAILGUN_API_KEY'),
      domain: Config.getEnv(envPrefix, 'MAILGUN_DOMAIN')
    }

    localConfig.reload = Config.getEnv(envPrefix, 'RELOAD')

    // Client url
    localConfig.client_host = "https://" + Config.getEnv('CLIENT_HOST')

    if (!localConfig.sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No ' + envPrefix.toUpperCase + '_SECRET provided.')
      }
      localConfig.sessionSecret = 'dev'
    }

    this.data = Config.loadConfig(envPrefix, localConfig)
  }

  generateSecret(text) {
    // TODO remove the hardcoded secret in case of API_SECRET not being present
    return crypto.createHmac('sha256', Config.getEnv(envPrefix, 'SECRET') || 'secret').update(text).digest()
  }
}
