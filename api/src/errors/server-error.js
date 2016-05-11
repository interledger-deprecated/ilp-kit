'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class ServerError extends BaseError {
  constructor (message) {
    super(message)
  }

  * handler (ctx, log) {
    log.warn('Server error: ' + this.message)
    ctx.status = 500
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = ServerError