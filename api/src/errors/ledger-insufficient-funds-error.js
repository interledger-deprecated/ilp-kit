'use strict'

const UnprocessableEntityError =
require('five-bells-shared/errors/unprocessable-entity-error')

class LedgerInsufficientFundsError extends UnprocessableEntityError {
  constructor (message, accountIdentifier) {
    super(message)
    this.accountIdentifier = accountIdentifier
  }

  async handler (ctx, log) {
    log.warn('Insufficient Funds: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = LedgerInsufficientFundsError
