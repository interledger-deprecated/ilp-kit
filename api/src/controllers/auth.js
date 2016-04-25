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
      /**
       * @api {post} /auth/login Login
       * @apiName Login
       * @apiGroup Auth
       * @apiVersion 1.0.0
       *
       * @apiDescription Login (used for cookie based auth)
       *
       * @apiExample {shell} Login
       *    curl -X POST -d
       *    '{
       *        "username": "alice",
       *        "password": "alice"
       *    }'
       *    http://wallet.example/auth/login
       *
       * @apiSuccessExample {json} 200 Response:
       *    HTTP/1.1 200 OK
       *    {
       *      "username": "alice",
       *      "account": "http://wallet.example/ledger/accounts/alice",
       *      "balance": "1000",
       *      "id": 1
       *    }
       */
      router.post('/auth/login', passport.authenticate('local'), this.load)
      router.get('/auth/load', this.load)
      router.post('/auth/logout', this.logout)
    }

    /**
     * @api {get} /auth/load Load
     * @apiName Load
     * @apiGroup Auth
     * @apiVersion 1.0.0
     *
     * @apiDescription Get currently authenticated user (used for cookie based auth)
     *
     * @apiExample {shell} Load
     *    curl -X GET
     *    http://wallet.example/auth/load
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "username": "alice",
     *      "account": "http://wallet.example/ledger/accounts/alice",
     *      "balance": "1000",
     *      "id": 1
     *    }
     */
    static * load (next) {
      let user = this.req.user

      if (!user) return this.status = 404

      this.params.username = user.username

      yield Users.getResource.call(this, next)
    }

    /**
     * @api {post} /auth/logout Logout
     * @apiName Logout
     * @apiGroup Auth
     * @apiVersion 1.0.0
     *
     * @apiDescription Logout (used for cookie based auth)
     *
     * @apiExample {shell} Logout
     *    curl -X POST
     *    http://wallet.example/auth/logout
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     */
    static logout () {
      this.session = null
      this.status = 200
    }
  }
}