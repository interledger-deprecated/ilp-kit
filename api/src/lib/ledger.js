'use strict'

const superagent = require('superagent')
const EventEmitter = require('events').EventEmitter

const PaymentFactory = require('../models/payment')
const UserFactory = require('../models/user')

const Config = require('./config')
const Log = require('./log')

const NotFoundError = require('../errors/not-found-error')

// TODO exception handling
module.exports = class Ledger extends EventEmitter {
  constructor (deps) {
    super()

    const self = this

    this.config = deps(Config)
    const log = deps(Log)
    this.log = log('ledger')
    this.ledgerUri = this.config.data.getIn(['ledger', 'uri'])
    this.ledgerUriPublic = this.config.data.getIn(['ledger', 'public_uri'])

    deps.later(() => {
      self.User = deps(UserFactory)
      self.Payment = deps(PaymentFactory)
    })
  }

  // TODO caching
  async getInfo (uri) {
    const ledgerUri = uri || this.ledgerUri
    let response

    try {
      this.log.info('getting ledger info ' + ledgerUri)
      response = await superagent.get(ledgerUri)
    } catch (err) {
      throw err
    }

    return response.body
  }

  async existsAccount (user) {
    try {
      await this.getAccount(user, true)
      return true
    } catch (e) {
      if (e.name === 'NotFoundError') {
        return false
      } else { throw e }
    }
  }

  async getAccount (user, admin) {
    let response

    try {
      response = await superagent
        .get(this.ledgerUri + '/accounts/' + user.username)
        .auth(admin ? this.config.data.getIn(['ledger', 'admin', 'user']) : user.username, admin ? this.config.data.getIn(['ledger', 'admin', 'pass']) : user.password)
    } catch (e) {
      if (e.response && e.response.body &&
         (e.response.body.id === 'NotFoundError' ||
          e.response.body.id === 'UnauthorizedError')) {
        throw new NotFoundError(e.response.body.message)
      } else {
        throw e
      }
    }

    return response.body
  }

  async getAccounts () {
    let response

    try {
      response = await superagent
        .get(this.ledgerUri + '/accounts')
        .auth(this.config.data.getIn(['ledger', 'admin', 'user']), this.config.data.getIn(['ledger', 'admin', 'pass']))
    } catch (e) {
      if (e.response && e.response.body &&
        (e.response.body.id === 'NotFoundError' ||
        e.response.body.id === 'UnauthorizedError')) {
        throw new NotFoundError(e.response.body.message)
      } else {
        throw e
      }
    }

    return response.body
  }

  async putAccount (auth, data) {
    const response = await superagent
      .put(this.ledgerUri + '/accounts/' + data.name)
      .send(data)
      .auth(auth.username, auth.password)

    return response.body
  }

  // Make sure admin minimum allowed balance is negative infinity
  async setupAdminAccount () {
    const username = this.config.data.getIn(['ledger', 'admin', 'user'])
    const password = this.config.data.getIn(['ledger', 'admin', 'pass'])

    // Get the account
    const account = await this.getAccount({ username, password })

    delete account.id
    delete account.ledger
    delete account.balance

    account.minimum_allowed_balance = '-infinity'

    // Update the account
    const response = await superagent
      .put(this.ledgerUri + '/accounts/' + username)
      .send(account)
      .auth(username, password)

    return response.body
  }

  updateAccount (user, admin) {
    const data = {
      name: user.username
    }

    if (user.balance) {
      data.balance = user.balance
    }

    if (user.newPassword) {
      data.password = user.newPassword
    }

    if (admin) {
      user = {
        username: this.config.data.getIn(['ledger', 'admin', 'user']),
        password: this.config.data.getIn(['ledger', 'admin', 'pass'])
      }
    }

    return this.putAccount(user, data)
  }

  createAccount (user) {
    const data = {
      name: user.username,
      balance: '0'
    }

    if (user.password) {
      data.password = user.password
    }

    return this.putAccount({
      username: this.config.data.getIn(['ledger', 'admin', 'user']),
      password: this.config.data.getIn(['ledger', 'admin', 'pass'])
    }, data)
  }
}
