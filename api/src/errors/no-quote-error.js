'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class NoQuoteError extends BaseError {
  async handler (ctx, log) {
    log.warn('Not Found: ' + this.message)
    ctx.status = 404
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = NoQuoteError
