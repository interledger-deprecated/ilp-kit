const jwt = require('jsonwebtoken')
const debug = require('debug')('jsonwebtoken')
const Config = require('./config')
const uuid = require('uuid')

module.exports = class Token {
  constructor (deps) {
    this.config = deps(Config)
    this.secret = this.config.generateSecret('token')

    // TODO: decide on and implement in a persistent token blacklist
    this._blacklist = {}
    this.tokenStore = {
      put: (decodedToken) => { this._blacklist[decodedToken.jti] = decodedToken },
      contains: (jti) => { return !!this._blacklist[jti] }
    }
  }

 /**
 * Creates a Json Web Token for a given trustline prefix with an optional validity duration.
 *
 * @param  {string} prefix   The trustline prefix for which the token is valid.
 * @param  {number or string} expiresIn   Optional. Expressed in seconds or a string describing a time span. Eg: 60, "2 days", "10h", "7d"
 * @return {string}   Json Web Token
 */
  create (prefix, expiresIn) {
    return jwt.sign({}, this.secret, Object.assign({
      algorithm: 'HS256',
      subject: prefix,
      jwtid: uuid()
    },
      // TODO: make expiresIn a mandatory property of the json web token
      expiresIn && {expiresIn})
    )
  }

  list (prefix) {
    // TODO: return all tokens for a given prefix
  }

  revoke (token) {
    if (!this.isValid(token)) throw new Error('Invalid Token')
    const decodedToken = jwt.decode(token)
    if (decodedToken.jti) throw new Error('Token misses id: ' + JSON.stringify())

    // TODO: store id of revoked tokens in a persistent store
    this.tokenStore.put(decodedToken.jti, decodedToken)
  }

  isRevoked (token) {
    const decodedToken = jwt.decode(token)
    return decodedToken.jti && this.tokenStore.contains(decodedToken.jti)
  }

  /**
   * Checks if a given JSON Web Token is valid for a given trustline prefix.
   *
   * @param  {[type]}  prefix The trustline prefix
   * @param  {[type]}  token  JSON Web Token
   * @return {Boolean}        True if the token is valid, false otherwise.
   */
  isValid (prefix, token) {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: [ 'HS256' ],
        subject: prefix
      }) && !this.isRevoked(token)
    } catch (e) {
      debug('token validation error:', e.message)
      return false
    }
  }
}
