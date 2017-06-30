const jsonWebToken = require('jsonwebtoken')

module.exports = class Token {
  constructor (deps) {
    this.config = deps(Config)
    this.secret = this.config.data.getIn(['api', 'secret'])
  }

  get (prefix, duration) {
    return jsonWebToken.sign({
      prefix: prefix,
      expire: String(Date.now() + duration)
    }, this.secret)
  }

  isValid (prefix, token) {
    const decoded = jsonWebToken.verify(token, this.secret, {
      algorithms: [ 'HS256' ]
    })

    return (Date.now() < +decoded.expire) && (decoded.prefix === prefix)
  }
}
