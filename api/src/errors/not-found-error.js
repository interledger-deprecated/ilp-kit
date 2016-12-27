'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class NotFoundError extends BaseError {
  constructor(message) {
    super(message)
  }

  * handler(ctx, log) {
    log.warn('Not Found: ' + this.message)
    ctx.status = 404
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = NotFoundError
