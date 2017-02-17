"use strict"

module.exports = UsersControllerFactory

const fs = require('fs')
const superagent = require('superagent-promise')(require('superagent'), Promise)
const requestIp = require('request-ip')
const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Socket = require('../lib/socket')
const Config = require('../lib/config')
const Mailer = require('../lib/mailer')
const Pay = require('../lib/pay')
const UserFactory = require('../models/user')
const InviteFactory = require('../models/invite')

const UsernameTakenError = require('../errors/username-taken-error')
const EmailTakenError = require('../errors/email-taken-error')
const PasswordsDontMatchError = require('../errors/passwords-dont-match-error')
const InvalidVerification = require('../errors/invalid-verification-error')
const ServerError = require('../errors/server-error')
const InvalidBodyError = require('../errors/invalid-body-error')

const USERNAME_REGEX = /^[a-z0-9]([a-z0-9]|[-](?!-)){0,18}[a-z0-9]$/

UsersControllerFactory.constitute = [Auth, UserFactory, InviteFactory, Log, Ledger, Socket, Config, Mailer, Pay]
function UsersControllerFactory (auth, User, Invite, log, ledger, socket, config, mailer, pay) {
  log = log('users')

  return class UsersController {
    static init (router) {
      router.get('/users/:username', auth.checkAuth, this.getResource)
      router.post('/users/:username', User.createBodyParser(), this.postResource)
      router.put('/users/:username', auth.checkAuth, this.putResource)
      router.post('/users/:username/reload', auth.checkAuth, this.reload)
      router.get('/users/:username/profilepic', this.getProfilePicture)

      // Email verification
      router.put('/users/:username/verify', this.verify)
      router.post('/users/:username/resend-verification', this.resendVerification)

      router.get('/receivers/:username', this.getReceiver)

      // Admin
      router.get('/users', this.checkAdmin, this.getAll)
    }

    // TODO move to auth
    static * checkAdmin(next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      // TODO throw exception
      this.status = 404
    }

    static * getAll() {
      this.body = yield ledger.getAccounts()
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
     *    https://wallet.example/users/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "username": "alice",
     *      "name": "Alice Faye",
     *      "balance": "1000",
     *      "id": 1
     *    }
     */
    static * getResource() {
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
     *    curl -X POST -H "Content-Type: application/json" -d
     *    '{
     *        "password": "alice"
     *    }'
     *    https://wallet.example/users/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 201 OK
     *    {
     *      "username": "alice",
     *      "balance": "1000",
     *      "id": 1
     *    }
     */

    // TODO should support both create and update
    static * postResource () {
      let username = this.params.username.toLowerCase()

      if (!USERNAME_REGEX.test(username)) {
        throw new InvalidBodyError('Username must be 2-20 characters, lowercase letters, numbers and hyphens ("-") only, with no two or more consecutive hyphens.')
      }

      // TODO validate email

      const userObj = this.body

      // check if registration is enabled
      if (!config.data.get('registration') && !userObj.inviteCode) {
        throw new InvalidBodyError('Registration is disabled without an invite code')
      }

      let invite

      // Invite code
      if (userObj.inviteCode) {
        invite = yield Invite.findOne({where: {code: userObj.inviteCode, claimed: false}})

        if (!invite && !config.data.get('registration')) {
          throw new InvalidBodyError('The invite code is wrong')
        }
      }

      let dbUser = yield User.findOne({where: {
        $or: [
          { username: username },
          { email: userObj.email }
        ]
      }})

      // TODO check if the ledger account already exists (probably not)
      if (dbUser) {
        // Username is already taken
        if (dbUser.username === username) {
          throw new UsernameTakenError('Username is already taken')
        }

        // Email is already taken
        throw new EmailTakenError('Email is already taken')
      }

      // Check for fraud
      const serviceUrl = config.data.getIn(['antifraud', 'service_url'])

      if (serviceUrl) {
        const maxRisk = config.data.getIn(['antifraud', 'max_risk'])
        let response

        try {
          response = yield superagent.post(serviceUrl, {
            email: userObj.email || '',
            username: userObj.username || '',
            name: userObj.name || '',
            phone: userObj.phone || '',
            address1: userObj.address1 || '',
            address2: userObj.address2 || '',
            city: userObj.city || '',
            region: userObj.region || '',
            country: userObj.country || '',
            zip_code: userObj.zip_code || '',
            ip_address: requestIp.getClientIp(this.req),
            augurio_unique_id: userObj.fingerprint
          })
        } catch (err) {
          console.log('users:172', err)
        }

        if (response.body && response.body.risklevel) {
          log.debug('Signup try: risk level is', response.body.risklevel)

          if (response.body.risklevel > maxRisk) {
            // TODO something more meaningful
            throw new ServerError()
          }
        }
      }

      userObj.username = username

      // Create the ledger account
      let ledgerUser
      try {
        ledgerUser = yield ledger.createAccount(userObj)
      } catch (e) {
        throw new UsernameTakenError('Ledger rejected username')
      }

      // Create the db user
      dbUser = new User()
      dbUser.setDataExternal(userObj)

      try {
        dbUser = yield dbUser.save()
        dbUser = User.fromDatabaseModel(dbUser)

        // Invite codes can only be used once
        if (invite) {
          // Admin account funding the new account
          const source = yield User.findOne({
            where: {
              username: config.data.getIn(['ledger', 'admin', 'user'])
            }
          })

          // Send the invite money
          yield pay.pay({
            source: source.getDataExternal(),
            destination: dbUser.username,
            sourceAmount: invite.amount,
            destinationAmount: invite.amount,
            message: 'Claimed invite code: ' + invite.code
          })

          invite.user_id = dbUser.id
          invite.claimed = true

          yield invite.save()
        }

      // TODO:SECURITY account should be funded at this point
      } catch (e) {
        throw new ServerError()
      }

      // Fund the newly created account
      yield UsersController.reload(dbUser)

      // Send a welcome email
      yield mailer.sendWelcome({
        name: dbUser.username,
        to: dbUser.email,
        link: User.getVerificationLink(dbUser.username, dbUser.email)
      })

      const user = yield dbUser.appendLedgerAccount()

      // TODO callbacks?
      this.req.logIn(user, err => {})

      log.debug('created user ' + username)

      this.body = user.getDataExternal()
      this.status = 201
    }

    /**
     * @api {put} /users/:username Update user
     * @apiName PutUser
     * @apiGroup User
     * @apiVersion 1.0.0
     *
     * @apiParam {String} username username
     *
     * @apiExample {shell} Update user email
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "email": "alice@example.com"
     *        "name": "Alice Faye"
     *    }'
     *    https://wallet.example/users/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "username": "alice",
     *      "name": "Alice Faye",
     *      "balance": "1000",
     *      "id": 1
     *    }
     */
    static * putResource () {
      const data = this.body
      const user = yield User.findOne({ where: {id: this.req.user.id} })

      // Is the current password right?
      yield ledger.getAccount({
        username: user.username,
        password: data.password
      })

      // TODO:SECURITY sanity checking

      // Password change
      if (data.newPassword) {
        if (data.newPassword !== data.verifyNewPassword) {
          throw new PasswordsDontMatchError('Passwords don\'t match')
        }

        // Update the ledger user
        yield ledger.updateAccount({
          username: user.username,
          password: data.password,
          newPassword: data.newPassword
        })

        // If this is the admin, update the environment and the env.list file too
        if (user.isAdmin) {
          config.changeAdminPass(data.newPassword)
        }

        user.password = data.newPassword
      }

      if (data.email) {
        yield user.changeEmail(data.email)

        yield mailer.changeEmail({
          name: user.username,
          to: user.email,
          link: User.getVerificationLink(user.username, user.email)
        })
      }

      user.name = data.name

      try {
        yield user.save()

        this.req.logIn(yield user.appendLedgerAccount(), err => {})
        this.body = user.getDataExternal()
      } catch(e) {
        // TODO throw an exception
        this.status = 500
        log.warn(e)
      }
    }

    // This will only reload if the "reload" env var is true
    static * reload(user) {
      if (!config.data.get('reload')) {
        return this.status = 404
      }

      if (!user.username) {
        user = this.req.user
      }

      // Admin account funding the new account
      const source = yield User.findOne({
        where: {
          username: config.data.getIn(['ledger', 'admin', 'user'])
        }
      })

      // Send the money
      yield pay.pay({
        source: source.getDataExternal(),
        destination: user.username,
        sourceAmount: 1000,
        destinationAmount: 1000,
        message: 'Free money'
      })

      this.status = 200
    }

    /**
     * @api {put} /users/:username/verify Verify user email address
     * @apiName VerifyUser
     * @apiGroup User
     * @apiVersion 1.0.0
     *
     * @apiParam {String} username username
     * @apiParam {String} code verification code
     *
     * @apiExample {shell} Verify user email address
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -H "Content-Type: application/json" -d
     *    '{
     *        "code": "1f7aade2946667fac85ebaf7259182ead6b1fe062b5e8bb0ffa1b9d417431acb"
     *    }'
     *    https://wallet.example/users/alice/verify
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "username": "alice",
     *      "balance": "1000",
     *      "id": 1,
     *      "email_verified": true
     *    }
     */
    static * verify() {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      const dbUser = yield User.findOne({where: {username: username}})

      // Code is wrong
      if (this.body.code !== User.getVerificationCode(dbUser.email)) {
        throw new InvalidVerification('Verification code is invalid')
      }

      // TODO different result if the user has already been verified
      dbUser.email_verified = true
      yield dbUser.save()

      this.status = 200
    }

    /**
     * @api {post} /users/:username/resend-verification Resend verification email
     * @apiName ResendVerificationEmail
     * @apiGroup User
     * @apiVersion 1.0.0
     *
     * @apiParam {String} username username
     *
     * @apiExample {shell} Resend verification email
     *    curl -X POST
     *    https://wallet.example/users/alice/resend-verification
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     */
    static * resendVerification () {
      let username = this.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      const dbUser = yield User.findOne({where: {username: username}})

      // TODO could sometimes be sendWelcome
      yield mailer.changeEmail({
        name: dbUser.username,
        to: dbUser.email,
        link: User.getVerificationLink(dbUser.username, dbUser.email)
      })

      this.status = 200
    }

    /**
     * @api {get} /receivers/:username Get receiver details
     * @apiName GetReceiver
     * @apiGroup Receiver
     * @apiVersion 1.0.0
     *
     * @apiParam {String} username receiver username
     *
     * @apiExample {shell} Get receiver details
     *    curl -X GET
     *    https://wallet.example/receivers/alice
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "type": "payee",
     *      "account": "wallet.alice",
     *      "currency_code": "USD",
     *      "currency_symbol": "$",
     *      "name": "Alice Faye",
     *      "image_url": "http://server.example/picture.jpg"
     *    }
     */
    static * getReceiver() {
      const ledgerPrefix = config.data.getIn(['ledger', 'prefix'])
      let user = yield User.findOne({where: {username: this.params.username}})

      if (!user) {
        // TODO throw exception
        return this.status = 404
      }

      user = user.getDataExternal()

      const ledgerInfo = ledger.getInfo()

      this.body = {
        'type': 'payee',
        'account': ledgerPrefix + user.username,
        'currency_code': config.data.getIn(['ledger', 'currency', 'code']),
        'currency_symbol': config.data.getIn(['ledger', 'currency', 'symbol']),
        'precision': ledgerInfo.precision,
        'scale': ledgerInfo.scale,
        'name': user.name,
        'image_url': user.profile_picture
      }
    }

    static * getProfilePicture() {
      const user = yield User.findOne({where: {username: this.params.username}})

      if (!user) {
        // TODO throw exception
        return this.status = 404
      }

      const file = __dirname + '/../../../uploads/' + user.profile_picture

      if (!fs.existsSync(file)) {
        return this.status = 422
      }

      const img = fs.readFileSync(file)
      this.body = img
    }
  }
}
