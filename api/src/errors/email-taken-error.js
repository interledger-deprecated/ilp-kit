'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class EmailTakenError extends BaseError {
  async handler (ctx, log) {
    log.warn('Email taken: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = EmailTakenError
