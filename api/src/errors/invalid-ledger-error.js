'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class InvalidLedgerError extends BaseError {
  async handler (ctx, log) {
    log.warn('Invalid ledger: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = InvalidLedgerError
