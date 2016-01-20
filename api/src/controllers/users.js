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

UsersControllerFactory.constitute = [UserFactory, Auth, Log, DB, Config, Ledger]
function UsersControllerFactory (User, auth, log, db, config, ledger) {
  log = log('users')

  return class UsersController {
    static init (router) {
      //router.put('/users/:id', User.createBodyParser(), this.putResource)
      router.post('/users/:id/reload', User.createBodyParser(), this.reload)
    }

    static * putResource () {

    }

    static * reload () {
      const self = this
      let id = this.params.id || ''
      request.validateUriParameter('id', id, 'Identifier')
      id = id.toLowerCase()

      // SQLite's implementation of upsert does not tell you whether it created the
      // row or whether it already existed. Since we need to know to return the
      // correct HTTP status code we unfortunately have to do this in two steps.
      let existed
      yield db.transaction(function * (transaction) {
        existed = yield User.findOne({where: {username: id}}, { transaction })
      })

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
