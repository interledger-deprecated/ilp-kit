'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class InvalidVerificationError extends BaseError {
  constructor (message) {
    super(message)
  }

  * handler (ctx, log) {
    log.warn('Email verification: ' + this.message)
    ctx.status = 400
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = InvalidVerificationError