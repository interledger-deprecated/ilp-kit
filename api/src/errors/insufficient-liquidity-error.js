'use strict'

const UnprocessableEntityError =
require('five-bells-shared/errors/unprocessable-entity-error')

class InsufficientLiquidityError extends UnprocessableEntityError {
  constructor (message, accountIdentifier) {
    super(message)
    this.accountIdentifier = accountIdentifier
  }

  async handler (ctx, log) {
    log.warn('Insufficient Liquidity: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = InsufficientLiquidityError
