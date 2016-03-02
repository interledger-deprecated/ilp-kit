'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class NoPathsError extends BaseError {
  constructor (message) {
    super(message)
  }

  * handler (ctx, log) {
    log.warn('PathFind: ' + this.message)
    ctx.status = 404
    ctx.body = {
      id: this.name,
      message: this.message
    }
  }
}

module.exports = NoPathsError
