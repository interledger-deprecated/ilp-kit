"use strict"

module.exports = AuthsControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')

AuthsControllerFactory.constitute = [UserFactory, Log, DB, Config]
function AuthsControllerFactory (User, log, db, config) {
  log = log('auth')

  return class AuthController {
    static init (router) {
      router.get('/auth/load', this.load)
      router.get('/auth/logout', this.logout)
      router.post('/auth/login', passport.authenticate('local'))
    }

    // TODO load the ledger balance
    static load () {
      this.body = this.req.user

      if (!this.req.user) {
        this.status = 404;
      }
    }

    static logout () {
      this.session = null
      this.body = {}
    }
  }
}