'use strict'

module.exports = AuthControllerFactory

const body = require('koa-better-body')
const path = require('path')
const passport = require('koa-passport')
const jimp = require('jimp')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Ledger = require('../lib/ledger')
const Mailer = require('../lib/mailer')
const UserFactory = require('../models/user')

const NotFoundError = require('../errors/not-found-error')
const PasswordsDontMatchError = require('../errors/passwords-dont-match-error')
const InvalidBodyError = require('../errors/invalid-body-error')

AuthControllerFactory.constitute = [UserFactory, Log, Ledger, Mailer, Auth]
function AuthControllerFactory (User, log, ledger, mailer, auth) {
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
       *    curl -X POST -H "Content-Type: application/json" -d
       *    '{
       *        "username": "alice",
       *        "password": "alice"
       *    }'
       *    https://wallet.example/auth/login
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

      // Local Auth
      router.post('/auth/login', passport.authenticate('local'), this.load)

      /**
       * @api {get} /auth/github Github Auth
       * @apiName Github Auth
       * @apiGroup Auth
       * @apiVersion 1.0.0
       *
       * @apiDescription Github OAuth (used for cookie based auth)
       */

      // GitHub OAuth
      router.get('/auth/github', passport.authenticate('github'))

      /**
       * @api {get} /auth/github/callback Github Auth Callback
       * @apiName Github Auth Callback
       * @apiGroup Auth
       * @apiVersion 1.0.0
       *
       * @apiDescription Github Auth Callback (used for cookie based auth)
       */
      router.get('/auth/github/callback', passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
      }), this.load)

      // Get session user
      router.get('/auth/load', this.load)
      router.post('/auth/forgot-password', this.forgotPassword)
      router.post('/auth/change-password', this.changePassword)
      router.post('/auth/profilepic',
        body({
          multipart: true,
          uploadDir: __dirname + '/../../../uploads'
        }),
        auth.checkAuth,
        this.changeProfilePicture)

      // Logout. Clears the session
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
     *    https://wallet.example/auth/load
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
    static * load () {
      const user = this.req.user

      if (!user) throw new NotFoundError('No active user session')

      this.body = user.getDataExternal()
    }

    /**
     * @api {post} /auth/forgot-password Forgot Password
     * @apiName ForgotPassword
     * @apiGroup Auth
     * @apiVersion 1.0.0
     *
     * @apiDescription Get an email to change the password
     *
     * @apiParam {String} resource username or email
     *
     * @apiExample {shell} Forgot Password
     *    curl -X POST
     *    https://wallet.example/auth/forgot-password
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     */
    static * forgotPassword () {
      const resource = this.body.resource

      // TODO think about github users
      const dbUser = yield User.findOne({where: {
        $or: [
          { username: resource },
          { email: resource }
        ]
      }})

      if (!dbUser) throw new NotFoundError('Wrong username/email')

      // TODO Send the email
      yield mailer.forgotPassword({
        name: dbUser.username,
        to: dbUser.email,
        link: dbUser.generateForgotPasswordLink()
      })

      this.body = {}
      this.status = 200
    }

    static * changePassword () {
      const dbUser = yield User.findOne({ where: { username: this.body.username } } )

      if (!dbUser) throw new NotFoundError('Wrong username')

      if (this.body.password !== this.body.repeatPassword) {
        throw new PasswordsDontMatchError('Passwords don\'t match')
      }

      dbUser.verifyForgotPasswordCode(this.body.code)

      yield ledger.updateAccount({
        username: dbUser.username,
        newPassword: this.body.password
      }, true)

      // This invalidates the ForgotPasswordCode so that it's only used once
      dbUser.getDatabaseModel().changed('updated_at', true)
      yield dbUser.save()

      this.body = dbUser.getDataExternal()
    }

    static * changeProfilePicture () {
      const file = this.request.files && this.request.files[0]

      let user = this.req.user
      if (!user) throw new NotFoundError('No active user session')
      if (!file) throw new InvalidBodyError('Request doesn\'t include an image file')

      user = yield User.findOne({where: {id: user.id}})

      const newFilePath = file.path + '_square.' + file.type.split('/')[1]

      // Resize
      try {
        const image = yield jimp.read(file.path)

        image.cover(200, 200, jimp.HORIZONTAL_ALIGN_CENTER, jimp.VERTICAL_ALIGN_TOP)
          .write(newFilePath, err => {
            if (err) {
              console.log('auth:197', newFilePath, err)
            }
          })
      } catch (e) {
        throw new InvalidBodyError('Unsopported image format')
      }

      user.profile_picture = path.basename(newFilePath)

      try {
        yield user.save()
      } catch (e) {
        console.log('auth.js:191', e)
      }

      this.body = yield user.getDataExternal()
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
     *    https://wallet.example/auth/logout
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
