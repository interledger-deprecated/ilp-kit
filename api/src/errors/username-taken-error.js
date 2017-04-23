'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class UsernameTakenError extends BaseError {
  async handler (ctx, log) {
    log.warn('Username taken: ' + this.message)
    ctx.status = 422
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = UsernameTakenError
