const jsonWebToken = require('jsonwebtoken')
const debug = require('debug')('jsonwebtoken')

module.exports = class Token {
  constructor (deps) {
    this.config = deps(Config)
    this.secret = this.config.data.getIn(['api', 'secret'])
  }

  get (prefix, duration) {
    const expiresIn = isInfinity(duration)
      ? null
      : (Date.now() + duration) / 1000

    return jsonWebToken.sign({
      prefix,
      expiresIn
    }, this.secret)
  }

  isValid (prefix, token) {
    try {
      const decoded = jsonWebToken.verify(token, this.secret, {
        algorithms: [ 'HS256' ]
      })
    } catch (e) {
      debug('token validation error:', e.message)
      return false
    }

    return (Date.now() < +decoded.expire) && (decoded.prefix === prefix)
  }
}
