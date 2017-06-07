'use strict'

const superagent = require('superagent')
const exec = require('child_process').exec
const Config = require('five-bells-shared').Config
const envPrefix = 'api'
const crypto = require('crypto')
const generatePublicKey = require('ilp-plugin-virtual').generatePublicKey
const changeAdminPass = require('../../../bin/env').changeAdminPass

module.exports = class WalletConfig {
  constructor () {
    this.init()
  }

  init () {
    const localConfig = {}
    localConfig.ledger = {
      uri: Config.getEnv(envPrefix, 'LEDGER_URI'),
      public_uri: Config.getEnv(envPrefix, 'LEDGER_PUBLIC_URI') || Config.getEnv(envPrefix, 'LEDGER_URI'),
      admin: {
        user: Config.getEnv(envPrefix, 'LEDGER_ADMIN_USER'),
        pass: Config.getEnv(envPrefix, 'LEDGER_ADMIN_PASS')
      },
      prefix: Config.getEnv('LEDGER_ILP_PREFIX'),
      currency: {
        code: Config.getEnv('LEDGER_CURRENCY_CODE'),
        scale: Config.getEnv('LEDGER_CURRENCY_SCALE')
      }
    }

    // This will be announced in webfinger
    localConfig.ilpKitVersion = process.env['ILP_KIT_VERSION']

    // Google Analytics / Mixpanel tracking
    localConfig.track = {
      ga: Config.getEnv(envPrefix, 'TRACK_GA'),
      mixpanel: Config.getEnv(envPrefix, 'TRACK_MIXPANEL')
    }

    // Secrets
    localConfig.secret = Config.getEnv(envPrefix, 'SECRET')
    localConfig.sessionSecret = this.generateSecret('session').toString('base64')
    localConfig.conditionSecret = this.generateSecret('condition')

    // Github
    localConfig.github = {
      client_id: Config.getEnv(envPrefix, 'GITHUB_CLIENT_ID'),
      client_secret: Config.getEnv(envPrefix, 'GITHUB_CLIENT_SECRET'),
      secret: this.generateSecret('oauth:github')
    }

    // Registration
    localConfig.registration = Config.castBool(Config.getEnv(envPrefix, 'REGISTRATION'), false)

    // Email
    localConfig.mailgun = {
      api_key: Config.getEnv(envPrefix, 'MAILGUN_API_KEY'),
      domain: Config.getEnv(envPrefix, 'MAILGUN_DOMAIN')
    }

    // Anti fraud
    localConfig.antifraud = {
      service_url: Config.getEnv(envPrefix, 'ANTIFRAUD_SERVICE_URL'),
      max_risk: Config.getEnv(envPrefix, 'ANTIFRAUD_MAX_RISK')
    }

    localConfig.email = {
      sender_name: Config.getEnv(envPrefix, 'EMAIL_SENDER_NAME') || 'info',
      sender_address: Config.getEnv(envPrefix, 'EMAIL_SENDER_ADDRESS') || 'contact@' + localConfig.mailgun.domain
    }

    localConfig.connector = {
      ed25519_secret_key: Config.getEnv('CONNECTOR_ED25519_SECRET_KEY'),
      ledgers: Config.getEnv('CONNECTOR_LEDGERS'),
      public_key: generatePublicKey(Config.getEnv('CONNECTOR_ED25519_SECRET_KEY'))
    }

    localConfig.reload = Config.getEnv(envPrefix, 'RELOAD')

    // Client url
    localConfig.client_host = 'https://' + Config.getEnv('CLIENT_HOST')
    localConfig.client_title = Config.getEnv('CLIENT_TITLE') || 'ILP Kit'

    localConfig.sentry_dsn = Config.getEnv('SENTRY_DSN')

    if (!localConfig.sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No ' + envPrefix.toUpperCase + '_SECRET provided.')
      }
      localConfig.sessionSecret = 'dev'
    }

    this.data = Config.loadConfig(envPrefix, localConfig)
  }

  changeAdminPass (newPassword) {
    // Save to the env file
    changeAdminPass(newPassword)

    // Update the instance
    this.init()
  }

  generateSecret (text) {
    // TODO remove the hardcoded secret in case of API_SECRET not being present
    return crypto.createHmac('sha256', Config.getEnv(envPrefix, 'SECRET') || 'secret').update(text).digest()
  }

  async getVersions () {
    if (this.versions) return this.versions

    const current = require('../../../package.json').version
    const hash = await new Promise((resolve, reject) => {
      exec('git rev-parse --short HEAD', { cwd: __dirname }, (err, stdout) => {
        if (err) {
          reject(err)
        } else {
          resolve(stdout.split('\n').join(''))
        }
      })
    })

    const latest = await superagent.get('https://raw.githubusercontent.com/interledgerjs/ilp-kit/release/package.json')

    this.versions = {
      current,
      hash,
      latest: JSON.parse(latest.text).version
    }

    return this.versions
  }
}
