'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class PasswordsDontMatchError extends BaseError {
  * handler (ctx, log) {
    log.warn('Passwords don\'t match: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = PasswordsDontMatchError
