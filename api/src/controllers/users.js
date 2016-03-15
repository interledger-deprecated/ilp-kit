"use strict"

module.exports = UsersControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const UserFactory = require('../models/user')

UsersControllerFactory.constitute = [Auth, UserFactory, Log, Ledger]
function UsersControllerFactory (Auth, User, log, ledger) {
  log = log('users');

  return class UsersController {
    static init (router) {
      router.post('/users/:username/reload', Auth.isAuth, this.reload)
    }

    static * reload () {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      let user = yield User.findOne({where: {username: username}})

      // Load the ledger account
      let ledgerUser = yield ledger.getAccount(user)

      this.req.user.balance = parseInt(ledgerUser.balance) + 1000

      // Reload the ledger account
      ledgerUser = yield ledger.createAccount({
        username: this.req.user.username,
        password: this.req.user.password,
        balance: this.req.user.balance
      })

      user.balance = ledgerUser.balance

      this.body = user.getDataExternal()
      this.status = 200
    }
  }
}
