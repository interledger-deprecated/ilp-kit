"use strict"

module.exports = UsersControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')

UsersControllerFactory.constitute = [Auth, UserFactory, Log, DB, Config, Ledger]
function UsersControllerFactory (Auth, User, log, db, config, ledger) {
  log = log('users')

  return class UsersController {
    static init (router) {
      router.post('/users/:id/reload', Auth.isAuth, User.createBodyParser(), this.reload)
    }

    static * putResource () {

    }

    static * reload () {
      const self = this
      let id = this.params.id || ''
      request.validateUriParameter('id', id, 'Identifier')
      id = id.toLowerCase()

      let existed = yield User.findOne({where: {username: id}})

      // Load the ledger account
      let ledgerUser = yield ledger.getAccount(this.req.user)

      self.req.user.balance = parseInt(ledgerUser.balance) + 1000

      // Reload the ledger account
      ledgerUser = yield ledger.createAccount(self.req.user)

      existed.balance = ledgerUser.balance

      this.body = existed.getDataExternal()
      this.status = 200
    }
  }
}
