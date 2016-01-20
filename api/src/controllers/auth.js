"use strict"

module.exports = AuthsControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')
const UsernameTakenError = require('../errors/username-taken-error')

AuthsControllerFactory.constitute = [UserFactory, Log, DB, Config, Ledger]
function AuthsControllerFactory (User, log, db, config, ledger) {
  log = log('auth')

  return class AuthController {
    static init (router) {
      router.get('/auth/load', this.load)
      router.get('/auth/logout', this.logout)
      router.post('/auth/register', User.createBodyParser(), this.register)
      router.post('/auth/login', passport.authenticate('local'), this.load)
    }

    static * register () {
      const self = this
      let id = this.body.username || ''
      request.validateUriParameter('id', id, 'Identifier')
      id = id.toLowerCase()

      let user = yield User.findOne({where: {username: id}})

      // Username is already taken
      if (user) {
        throw new UsernameTakenError("Username is already taken")
      }

      // Create a ledger account
      const ledgerUser = yield ledger.createAccount(self.body);

      yield db.transaction(function * (transaction) {
        user = yield User.createExternal(self.body, { transaction })
      })

      // TODO load balance in req.login
      self.body.balance = ledgerUser.balance
      self.body.id = user.id

      // TODO callbacks?
      self.req.logIn(self.body, function (err) {})

      log.debug('created user ID ' + id)

      this.body = self.body.getDataExternal()
      this.status = 201
    }

    // TODO load the ledger balance
    static * load () {
      let user = this.req.user

      // There's no active session
      if (!user) {
        this.status = 404;
        return;
      }

      // Get account balance
      const ledgerUser = yield ledger.getAccount(user)
      user.balance = ledgerUser.balance

      this.body = user
    }

    static logout () {
      this.session = null
      this.body = {}
    }
  }
}
