"use strict"

module.exports = AuthsControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')

AuthsControllerFactory.constitute = [UserFactory, Log, DB, Config, Ledger]
function AuthsControllerFactory (User, log, db, config, ledger) {
  log = log('auth')

  return class AuthController {
    static init (router) {
      router.get('/auth/load', this.load)
      router.get('/auth/logout', this.logout)
      router.post('/auth/login', passport.authenticate('local'), this.load)
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
