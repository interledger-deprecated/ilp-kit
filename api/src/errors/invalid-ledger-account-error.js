'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class InvalidLedgerAccountError extends BaseError {
  async handler (ctx, log) {
    log.warn('Invalid ledger account: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = InvalidLedgerAccountError
