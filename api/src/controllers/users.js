'use strict'

module.exports = UsersControllerFactory

const fs = require('fs')
const path = require('path')
const request = require('five-bells-shared/utils/request')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Config = require('../lib/config')
const Mailer = require('../lib/mailer')
const Pay = require('../lib/pay')
const Antifraud = require('../lib/antifraud')
const UserFactory = require('../models/user')
const InviteFactory = require('../models/invite')
const Database = require('../lib/db')
const SPSP = require('../lib/spsp')

const UsernameTakenError = require('../errors/username-taken-error')
const EmailTakenError = require('../errors/email-taken-error')
const PasswordsDontMatchError = require('../errors/passwords-dont-match-error')
const InvalidVerification = require('../errors/invalid-verification-error')
const ServerError = require('../errors/server-error')
const InvalidBodyError = require('../errors/invalid-body-error')

const USERNAME_REGEX = /^[a-z0-9]([a-z0-9]|[-](?!-)){0,18}[a-z0-9]$/

function UsersControllerFactory (deps) {
  const sequelize = deps(Database)
  const auth = deps(Auth)
  const User = deps(UserFactory)
  const Invite = deps(InviteFactory)
  const log = deps(Log)('users')
  const ledger = deps(Ledger)
  const config = deps(Config)
  const mailer = deps(Mailer)
  const pay = deps(Pay)
  const spsp = deps(SPSP)
  const antifraud = deps(Antifraud)

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

      // Admin
      router.get('/users', this.checkAdmin, this.getAll)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      // TODO throw exception
      ctx.status = 404
    }

    static async getAll (ctx) {
      const balances = (await ledger.getAccounts()).reduce((agg, user) => {
        agg[user.name] = user.balance
        return agg
      }, {})

      ctx.body = (await User.findAll()).map((user) =>
        Object.assign({}, user, { balance: balances[user.username] }))
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
    static async getResource (ctx) {
      let username = ctx.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      if (ctx.req.user.username !== username) {
        // TODO throw exception
        ctx.status = 404
        return
      }

      const dbUser = await User.findOne({where: {username: username}})
      const user = await dbUser.appendLedgerAccount()

      ctx.body = user.getDataExternal()
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

    // Only supports create
    static async postResource (ctx) {
      const userObj = ctx.body

      // check if registration is enabled
      if (!config.data.get('registration') && !userObj.inviteCode) {
        throw new InvalidBodyError('Registration is disabled without an invite code')
      }

      let username = ctx.params.username.toLowerCase()
      if (!USERNAME_REGEX.test(username)) {
        throw new InvalidBodyError('Username must be 2-20 characters, lowercase letters, numbers and hyphens ("-") only, with no two or more consecutive hyphens.')
      }

      await antifraud.checkRisk(userObj) // throws if fraud risk is too high

      let dbUser
      let invite
      await sequelize.transaction(async function (t) {
        const opts = {transaction: t}

        userObj.username = username
        // TODO:BEFORE_DEPLOY make sure doesn't already exist (do the same for peers)
        userObj.destination = parseInt(Math.random() * 1000000)

        dbUser = new User()
        dbUser.setDataExternal(userObj)

        // Check if invite code is valid
        if (userObj.inviteCode) {
          invite = await Invite.findOne(Object.assign({
            where: {
              code: userObj.inviteCode,
              claimed: false
            }
          }, opts))

          if (invite) {
            dbUser.invite_code = invite.code
            invite.user_id = dbUser.id
            // throws if the user identified by user_id has already claimed another invite
            await invite.save(opts)
          } else if (!config.data.get('registration')) {
            throw new InvalidBodyError('The invite code is wrong')
          }
        }

        // Create the db user
        try {
          dbUser = await dbUser.save(opts)
          dbUser = User.fromDatabaseModel(dbUser)
        } catch (e) {
          let errorMsg = e.errors && e.errors[0] && e.errors[0].message
          if (errorMsg === 'username must be unique') {
            throw new UsernameTakenError('Username already registered.')
          } else if (errorMsg === 'email must be unique') {
            throw new EmailTakenError('Email already registered.')
          // } else if (errorMsg === 'invite_code must be unique') {
          } else {
            log.error(e)
            throw new ServerError()
          }
        }

        try {
          // Sanity check: Verify that a ledger account with that name does not exist yet
          // Otherwise an attacker could take over a ledger account
          // for which no ILP kit account exits
          const exists = await ledger.existsAccount(userObj)
          if (!exists) {
            await ledger.createAccount(userObj)
          } else {
            throw new Error(`Username ${userObj.username} already exists on the ledger` +
              ', but not in the ILP kit.')
          }
        } catch (e) {
          log.error(e)
          throw new UsernameTakenError('Ledger rejected username')
        }
      }).then(async function (result) {
        // transaction was commited
        await UsersController._onboardUser(ctx, invite, dbUser)
      }).catch(function (e) {
        // transaction was rolled back
        log.debug(e)
        throw e
      })
    }

    static async _handleInvite (invite, username) {
      try {
        if (invite) {
          if (invite.amount) {
            // Admin account funding the new account
            const admin = await User.findOne({
              where: {
                username: config.data.getIn(['ledger', 'admin', 'user'])
              }
            })
            const destination = username + '@' + config.data.getIn(['server', 'public_host'])
            const quoteReq = {
              user: admin.getDataExternal(),
              destination: destination,
              sourceAmount: invite.amount
            }

            // Get a quote
            const quote = await spsp.quote(quoteReq)

            // Send the invite money
            await pay.pay({
              user: admin.getDataExternal(),
              destination: destination,
              quote: quote
            })
            invite.claimed = true
            invite.save()
          }
        }
      } catch (e) {
        // TODO User did not receive his invite money
        log.error(e)
        throw new ServerError()
      }
    }

    static async _onboardUser (ctx, invite, dbUser) {
      if (invite) {
        await UsersController._handleInvite(invite, dbUser.username)
      }

      // Fund the newly created account
      if (config.data.get('reload')) {
        await UsersController._reload(dbUser)
      }

      // Send a welcome email
      await mailer.sendWelcome({
        name: dbUser.username,
        to: dbUser.email,
        link: User.getVerificationLink(dbUser.username, dbUser.email)
      })

      const user = await dbUser.appendLedgerAccount()

      // TODO callbacks?
      ctx.logIn(user, err => {
        if (err) {
          log.error('error while logging in: %s', err)
        }
      })

      log.debug('created user ' + dbUser.username)

      ctx.body = user.getDataExternal()
      ctx.status = 201
    }

    static async _reload (user) {
      // Admin account funding the new account
      const source = await User.findOne({
        where: {
          username: config.data.getIn(['ledger', 'admin', 'user'])
        }
      })

      const quote = await spsp.quote({
        user: source.getDataExternal(),
        destination: user.username + '@' + config.data.getIn(['server', 'public_host']),
        destinationAmount: 1000
      })

      quote.memo = 'Free money'

      // Send the money
      await pay.pay({
        user: source.getDataExternal(),
        destination: user.username,
        quote
      })
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
    static async putResource (ctx) {
      const data = ctx.body
      const user = await User.findOne({ where: {id: ctx.req.user.id} })

      // Is the current password right?
      await ledger.getAccount({
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
        await ledger.updateAccount({
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
        await user.changeEmail(data.email)

        await mailer.changeEmail({
          name: user.username,
          to: user.email,
          link: User.getVerificationLink(user.username, user.email)
        })
      }

      user.name = data.name

      try {
        await user.save()

        ctx.logIn(await user.appendLedgerAccount(), err => {
          if (err) {
            log.error('error while logging in: %s', err)
          }
        })
        ctx.body = user.getDataExternal()
      } catch (e) {
        // TODO throw an exception
        ctx.status = 500
        log.warn(e)
      }
    }

    // This will only reload if the "reload" env var is true
    static async reload (ctx) {
      if (!config.data.get('reload')) {
        ctx.status = 404
        return
      }

      const user = ctx.req.user

      await UsersController._reload(user)

      ctx.status = 200
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
    static async verify (ctx) {
      let username = ctx.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      const dbUser = await User.findOne({where: {username: username}})

      // Code is wrong
      if (ctx.body.code !== User.getVerificationCode(dbUser.email)) {
        throw new InvalidVerification('Verification code is invalid')
      }

      // TODO different result if the user has already been verified
      dbUser.email_verified = true
      await dbUser.save()

      ctx.status = 200
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
    static async resendVerification (ctx) {
      let username = ctx.params.username
      request.validateUriParameter('username', username, 'Identifier')
      username = username.toLowerCase()

      const dbUser = await User.findOne({where: {username: username}})

      // TODO could sometimes be sendWelcome
      await mailer.changeEmail({
        name: dbUser.username,
        to: dbUser.email,
        link: User.getVerificationLink(dbUser.username, dbUser.email)
      })

      ctx.status = 200
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
     *      "currency_scale": 2,
     *      "name": "Alice Faye",
     *      "image_url": "http://server.example/picture.jpg"
     *    }
     */
    static async getReceiver (ctx) {
      const ledgerPrefix = config.data.getIn(['ledger', 'prefix'])
      let user = await User.findOne({where: {username: ctx.params.username}})

      if (!user) {
        // TODO throw exception
        ctx.status = 404
        return
      }

      user = user.getDataExternal()

      ctx.body = {
        'type': 'payee',
        'account': ledgerPrefix + user.username,
        'currency_code': config.data.getIn(['ledger', 'currency', 'code']),
        'currency_scale': config.data.getIn(['ledger', 'currency', 'scale']),
        'name': user.name,
        'image_url': user.profile_picture
      }
    }

    static async getProfilePicture (ctx) {
      const user = await User.findOne({where: {username: ctx.params.username}})

      if (!user) {
        // TODO throw exception
        ctx.status = 404
        return
      }

      let filePath = path.resolve(__dirname, '../../../static/placeholder.png')

      if (user.profile_picture) {
        filePath = path.resolve(__dirname, '../../../uploads/', user.profile_picture)
      }

      if (!fs.existsSync(filePath)) {
        ctx.status = 422
        return
      }

      const img = fs.readFileSync(filePath)
      ctx.body = img
    }
  }
}
