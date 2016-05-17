"use strict"

module.exports = UsersControllerFactory

const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Socket = require('../lib/socket')
const Config = require('../lib/config')
const Mailer = require('../lib/mailer')
const UserFactory = require('../models/user')

const UsernameTakenError = require('../errors/username-taken-error')
const EmailTakenError = require('../errors/email-taken-error')
const PasswordsDontMatch = require('../errors/passwords-dont-match')

UsersControllerFactory.constitute = [Auth, UserFactory, Log, Ledger, Socket, Config, Mailer]
function UsersControllerFactory (Auth, User, log, ledger, socket, config, mailer) {
  log = log('users');

  return class UsersController {
    static init (router) {
      router.get('/users/:username', Auth.checkAuth, this.getResource)
      router.post('/users/:username', User.createBodyParser(), this.postResource)
      router.put('/users/:username', Auth.checkAuth, this.putResource)
      router.put('/users/:username/verify', this.verify)
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

      const dbUser = yield User.findOne({where: {username: username}})
      const user = yield dbUser.appendLedgerAccount()

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
      // TODO also validate email
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      let userObj = this.body

      let dbUser = yield User.findOne({where: {
        $or: [
          { username: username },
          { email: userObj.email }
        ]
      }})

      // TODO check if the http://account already exists
      if (dbUser) {
        // Username is already taken
        if (dbUser.username === username) {
          throw new UsernameTakenError("Username is already taken")
        }

        // Email is already taken
        throw new EmailTakenError("Email is already taken")
      }

      userObj.username = username

      // Create a ledger account
      let ledgerUser
      try {
        ledgerUser = yield ledger.createAccount(userObj)
      } catch (e) {
        // TODO throw exception
        console.log('users.js:113', e)
      }

      userObj.account = ledgerUser.id

      // Create the db user
      dbUser = new User()
      dbUser.setDataExternal(userObj)

      try {
        yield dbUser.save()
      } catch (e) {
        // TODO throw exception
        console.log('users.js:125', e)
      }

      yield mailer.sendWelcome({
        name: dbUser.username,
        to: dbUser.email,
        link: User.getVerificationLink(dbUser.username, dbUser.email)
      })

      const user = yield dbUser.appendLedgerAccount(ledgerUser)

      // TODO callbacks?
      this.req.logIn(user, function (err) {})

      log.debug('created user ' + username)

      this.body = user.getDataExternal()
      this.status = 201
    }

    static * verify () {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      const dbUser = yield User.findOne({where: {username: username}})

      // Code is wrong
      if (this.body.code !== User.getVerificationCode(dbUser.email)) {
        // TODO throw exception
        return this.body = {}
      }

      // TODO different result if the user has already been verified
      dbUser.email_verified = true
      yield dbUser.save()

      this.body = {'status':'ok'}
    }

    static * putResource () {
      const data = this.body
      let user = this.req.user

      // TODO:SECURITY sanity checking

      // Password change
      if (data.password) {
        if (data.password !== data.verifyPassword) {
          throw new PasswordsDontMatch('Passwords don\'t match')
        }

        // Update the ledger user
        yield ledger.updateAccount({
          username: user.username,
          password: user.password,
          newPassword: data.password
        })

        user.password = data.password
      }

      if (data.email) {
        yield user.changeEmail(data.email)

        yield mailer.changeEmail({
          name: user.username,
          to: user.email,
          link: User.getVerificationLink(user.username, user.email)
        })
      }

      try {
        yield user.save()
      } catch(e) {
        // TODO handle
        log.warn(e)
      }

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
