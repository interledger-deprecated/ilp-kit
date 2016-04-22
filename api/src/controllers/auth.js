"use strict"

module.exports = AuthsControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const UserFactory = require('../models/user')
const UsernameTakenError = require('../errors/username-taken-error')
const UsersControllerFactory = require('./users')

AuthsControllerFactory.constitute = [Auth, UserFactory, Log, Ledger, UsersControllerFactory]
function AuthsControllerFactory (Auth, User, log, ledger, Users) {
  log = log('auth')

  return class AuthController {
    static init (router) {
      router.get('/auth/load', this.load)
      router.get('/auth/logout', this.logout)
      router.post('/auth/register', User.createBodyParser(), this.register)
      router.post('/auth/login', passport.authenticate('local'), this.load)
    }

    /**
     * @api {post} /auth/register Register user
     * @apiName register
     * @apiGroup Auth
     * @apiVersion 1.0.0
     *
     * @apiDescription Create a wallet account
     *
     * @apiParam {String} username Account username
     * @apiParam {String} password Account password
     *
     * @apiExample {shell} Register an account
     *    curl -x POST
     *    http://wallet.example/auth/register
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "username": "bob",
     *      "account": "http://wallet.example/ledger/accounts/bob",
     *      "balance": "1000",
     *      "id": 1
     *    }
     */
    static * register () {
      let username = this.body.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      let user = yield User.findOne({where: {username: username}})

      // Username is already taken
      // TODO check if the http://account already exists
      if (user) {
        throw new UsernameTakenError("Username is already taken")
      }

      // Create a ledger account
      // TODO handle exceptions
      const ledgerUser = yield ledger.createAccount(this.body)

      this.body.account = ledgerUser.id

      user = yield User.createExternal(this.body)

      // TODO load balance in req.login
      this.body.balance = ledgerUser.balance
      this.body.id = user.id

      // TODO callbacks?
      this.req.logIn(this.body, function (err) {})

      log.debug('created user ' + username)

      this.body = this.body.getDataExternal()
      this.status = 201
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
