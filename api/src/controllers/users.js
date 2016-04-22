"use strict"

module.exports = UsersControllerFactory

const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Socket = require('../lib/socket')
const UserFactory = require('../models/user')

UsersControllerFactory.constitute = [Auth, UserFactory, Log, Ledger, Socket]
function UsersControllerFactory (Auth, User, log, ledger, socket) {
  log = log('users');

  return class UsersController {
    static init (router) {
      router.get('/users/:username', Auth.checkAuth, this.getResource)
      router.post('/users/:username/reload', Auth.checkAuth, this.reload)
    }

    /**
     * @api {get} /users/:username Get user
     * @apiName GetUser
     * @apiGroup Users
     * @apiVersion 1.0.0
     *
     * @apiDescription Get user
     *
     * @apiExample {shell} Get user
     *    curl -x GET
     *    http://wallet.example/users/alice
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
    static * getResource () {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      if (this.req.user.username !== username) {
        // TODO throw exception
        return this.status = 404
      }

      let user = yield User.findOne({where: {username: username}})

      // Get account balance
      const ledgerUser = yield ledger.getAccount(user)
      user.balance = Math.round(ledgerUser.balance * 100) / 100

      this.body = user.getDataExternal()
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

      // Inform the client
      socket.updateBalance(ledgerUser.name, ledgerUser.balance)

      // do we need this?
      this.body = user.getDataExternal()
      this.status = 200
    }
  }
}
