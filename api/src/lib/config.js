"use strict"

const Config = require('five-bells-shared').Config

module.exports = class LedgerUIConfig extends Config {
  constructor () {
    super('api')
    this.parseServerConfig()
    this.parseLedgerConfig()
    this.parseDatabaseConfig()
    this.parseSessionConfig()
  }

  parseLedgerConfig () {
    this.ledger = {
      admin: {}
    }
    this.ledger.uri = this.getEnv('LEDGER_URI')
    this.ledger.uriPrivate = this.getEnv('LEDGER_URI_PRIVATE') || this.ledger.uri
    this.ledger.admin.name = this.getEnv('LEDGER_ADMIN_NAME')
    this.ledger.admin.pass = this.getEnv('LEDGER_ADMIN_PASS')
  }

  parseSessionConfig () {
    this.sessionSecret = this.getEnv('SESSION_SECRET')

    if (!this.sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No ' + this.uppercasePrefix + 'SESSION_SECRET provided.')
      }
      this.sessionSecret = 'dev'
    }
  }
}