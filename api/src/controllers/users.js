"use strict"

module.exports = UsersControllerFactory

const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Socket = require('../lib/socket')
const Config = require('../lib/config')
const UserFactory = require('../models/user')

const UsernameTakenError = require('../errors/username-taken-error')
const PasswordsDontMatch = require('../errors/passwords-dont-match')

UsersControllerFactory.constitute = [Auth, UserFactory, Log, Ledger, Socket, Config]
function UsersControllerFactory (Auth, User, log, ledger, socket, config) {
  log = log('users');

  return class UsersController {
    static init (router) {
      router.get('/users/:username', Auth.checkAuth, this.getResource)
      router.post('/users/:username', User.createBodyParser(), this.postResource)
      router.put('/users/:username', Auth.checkAuth, this.putResource)
      router.post('/users/:username/reload', Auth.checkAuth, this.reload)

      router.get('/receivers/:username', this.getReceiver)
    }

    /**
     * @api {get} /users/:username Get user
     * @apiName GetUser
     * @apiGroup User
     * @apiVersion 1.0.0
     *
     * @apiDescription Get user
     *
     * @apiExample {shell} Get user
     *    curl -X GET -H "Authorization: Basic YWxpY2U6YWxpY2U="
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
      const ledgerUser = yield ledger.getAccount(user, true)
      user.balance = Math.round(ledgerUser.balance * 100) / 100

      this.body = user.getDataExternal()
    }

    /**
     * @api {post} /users/:username Create a user
     * @apiName PostUser
     * @apiGroup User
     * @apiVersion 1.0.0
     *
     * @apiParam {String} username username
     * @apiParam {String} password password
     *
     * @apiExample {shell} Post user
     *    curl -X POST -d
     *    '{
     *        "password": "alice"
     *    }'
     *    http://wallet.example/users/alice
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

    // TODO should support both create and update
    static * postResource () {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      let user = yield User.findOne({where: {username: username}})

      // Username is already taken
      // TODO check if the http://account already exists
      if (user) {
        throw new UsernameTakenError("Username is already taken")
      }

      this.body.username = username

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

    static * putResource () {
      const data = this.body
      let user = this.req.user

      user = yield User.findOne({where: {id: user.id}})

      // TODO:SECURITY sanity checking

      // Password change
      if (data.password) {
        if (data.password !== data.verifyPassword) {
          throw new PasswordsDontMatch('Passwords don\'t match')
        }

        // Update the ledger user
        yield ledger.updateAccount({
          username: this.req.user.username,
          password: this.req.user.password,
          newPassword: data.password
        })

        this.req.user.password = data.password
      }

      if (data.email) {
        yield user.changeEmail(data.email)
      }

      try {
        yield user.save()
      } catch(e) {
        // TODO handle
        log.warn(e)
      }

      user.password = this.req.user.password

      this.req.logIn(user, function (err) {})

      this.body = user.getDataExternal()
    }

    static * reload () {
      if (!config.data.get('reload')) {
        return this.status = 404
      }

      let user = this.req.user

      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      // Load the ledger account
      let ledgerUser = yield ledger.getAccount(user)

      user.balance = parseInt(ledgerUser.balance) + 1000

      // Reload the ledger account
      ledgerUser = yield ledger.updateAccount({
        username: user.username,
        balance: ''+user.balance
      }, true)

      user.balance = ledgerUser.balance

      // Inform the client
      socket.updateBalance(ledgerUser.name, ledgerUser.balance)

      // do we need this?
      this.body = user.getDataExternal()
      this.status = 200
    }

    static * getReceiver () {
      const ledgerUri = config.data.getIn(['ledger', 'public_uri'])
      const user = yield User.findOne({where: {username: this.params.username}})

      if (!user) {
        // TODO throw exception
      }

      this.body = {
        "type": "payee",
        "ledger": ledgerUri,
        "account": ledgerUri + "/accounts/" + user.username,
        "payments": config.data.getIn(['server', 'base_uri']) + "/receiver/" + user.username + "/payments"
      }
    }
  }
}
