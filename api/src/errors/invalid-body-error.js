'use strict'

const BaseError = require('five-bells-shared/errors/base-error')

class InvalidBodyError extends BaseError {
  constructor (message, validationErrors) {
    super(message)
    this.validationErrors = validationErrors
  }

  debugPrint (log, validationError, indent) {
    indent = indent || ''
    log.debug(indent + '-- ' + validationError)
    log.debug(indent + '   ' + validationError.schemaPath)
    if (validationError.subErrors) {
      validationError.subErrors.forEach((subError) => {
        this.debugPrint(log, subError, '  ' + indent)
      })
    }
  }

  async handler (ctx, log) {
    log.warn('Invalid body: ' + this.message)
    if (this.validationErrors) {
      for (let ve of this.validationErrors) {
        this.debugPrint(log, ve)
      }
    }

    ctx.status = 400
    ctx.body = {
      id: this.name,
      message: this.message
      // validationErrors: this.validationErrors
    }
  }
}

module.exports = InvalidBodyError
