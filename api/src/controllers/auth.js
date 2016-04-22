"use strict"

module.exports = AuthsControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const UserFactory = require('../models/user')
const UsersControllerFactory = require('./users')

AuthsControllerFactory.constitute = [Auth, UserFactory, Log, Ledger, UsersControllerFactory]
function AuthsControllerFactory (Auth, User, log, ledger, Users) {
  log = log('auth')

  return class AuthController {
    static init (router) {
      router.post('/auth/login', passport.authenticate('local'), this.load)
      router.get('/auth/load', this.load)
      router.get('/auth/logout', this.logout)
    }

    static * load (next) {
      let user = this.req.user
      this.params.username = user.username

      yield Users.getResource.call(this, next)
    }

    static logout () {
      this.session = null
      this.body = {}
    }
  }
}
