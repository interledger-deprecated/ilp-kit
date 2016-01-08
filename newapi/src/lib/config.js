"use strict"

const Config = require('five-bells-shared').Config

module.exports = class LedgerUIConfig extends Config {
  constructor () {
    super('ledgerui')
    this.parseServerConfig()
    this.parseDatabaseConfig()
    this.parseKeyConfig()

    if (process.env.NODE_ENV === 'unit') {
      this.server.public_host = 'localhost'
      this.server.port = 61337
      this.server.public_port = 80
      this.db.uri = 'sqlite://'
      this.updateDerivativeServerConfig()
    }
  }
}