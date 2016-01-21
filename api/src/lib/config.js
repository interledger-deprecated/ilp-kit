"use strict"

const Config = require('five-bells-shared').Config

module.exports = class LedgerUIConfig extends Config {
  constructor () {
    super('api')
    this.parseServerConfig()
    this.parseLedgerConfig()
    this.parseDatabaseConfig()

    if (process.env.NODE_ENV === 'unit') {
      this.server.public_host = 'localhost'
      this.server.port = 61337
      this.server.public_port = 80
      this.db.uri = 'sqlite://'
      this.updateDerivativeServerConfig()
    }
  }

  parseLedgerConfig () {
    this.ledger = {
      admin: {}
    }
    this.ledger.host = this.getEnv('LEDGER_HOST')
    this.ledger.port = this.getEnv('LEDGER_PORT')
    this.ledger.admin.name = this.getEnv('LEDGER_ADMIN_NAME')
    this.ledger.admin.pass = this.getEnv('LEDGER_ADMIN_PASS')
  }
}