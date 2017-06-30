const jsonWebToken = require('jsonwebtoken')
const debug = require('debug')('jsonwebtoken')

module.exports = class Token {
  constructor (deps) {
    this.config = deps(Config)
    this.secret = this.config.data.getIn(['api', 'secret'])
  }

 /**
 * Creates a Json Web Token for a given trustline prefix with an optional validity duration.
 * 
 * @param  {string} prefix   The trustline prefix for which the token is valid.
 * @param  {number or string} expiresIn   Optional. Expressed in seconds or a string describing a time span. Eg: 60, "2 days", "10h", "7d"
 * @return {string}   Json Web Token
 */
  get (prefix, expiresIn) {
    return jsonWebToken.sign({}, this.secret, Object.assign({
        algorithm: 'HS256',
        subject: prefix
      },
      {
        // TODO: make expiresIn a mandatory property of the json web token
        expiresIn && {expiresIn}
      })
    )
  }

  isValid (prefix, token) {
    try {
      return jsonWebToken.verify(token, this.secret, {
        algorithms: [ 'HS256' ],
        subject: prefix
      })
    } catch (e) {
      debug('token validation error:', e.message)
      return false
    }
  }
}
