"use strict"

const uuid = require('uuid4')
const co = require('co')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const UnauthorizedError = require('five-bells-shared/errors/unauthorized-error')

const LocalStrategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const GitHubStrategy = require('passport-github').Strategy

const Config = require('./config')
const Ledger = require('./ledger')

module.exports = class Auth {
  static constitute () { return [ UserFactory, Config, Ledger ] }
  constructor (User, config, ledger) {
    passport.use(new BasicStrategy(
      co.wrap(function * (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }

        const ledgerUser = yield ledger.getAccount({
          username: username,
          password: password
        })

        if (!ledgerUser) {
          return done(new UnauthorizedError('Unknown or invalid account / password'))
        }

        const dbUser = User.findOne({where:{username: username}})

        return done(null, dbUser)
      })
    ))

    passport.use(new LocalStrategy(
      co.wrap(function * (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }

        try {
          yield ledger.getAccount({
            username: username,
            password: password
          })
        } catch (e) {
          return done(new UnauthorizedError('Unknown or invalid account / password'))
        }

        const dbUser = yield User.findOne({where:{username: username}})

        dbUser.password = password

        return done(null, dbUser)
      })
    ))

    // TODO add an environment variable to disable github login, it should be optional
    if (config.data.getIn(['github', 'client_id'])) {
      passport.use(new GitHubStrategy(
        {
          clientID: config.data.getIn(['github', 'client_id']),
          clientSecret: config.data.getIn(['github', 'client_secret']),
          callbackURL: config.data.getIn(['server', 'base_uri']) + '/auth/github/callback'
        },
        // TODO this whole function is a dup from local register flow
        co.wrap(function * (accessToken, refreshToken, profile, done) {
          let user = yield User.findOne({where: {github_id: profile.id}})

          // User exists
          if (user) {
            // TODO Update the user with updated profile data
            return done(null, user)
          }

          // User doesn't exist, create one

          // TODO custom username
          let userObj = {
            username: profile.username,
            password: uuid(),
            github_id: profile.id,
            profile_picture: profile.photos[0].value
          }

          // Create a ledger account
          // TODO handle exceptions
          let ledgerUser
          try {
            ledgerUser = yield ledger.createAccount(userObj)
          } catch (e) {
            // TODO handle
          }

          userObj.account = ledgerUser.id

          try {
            user = yield User.createExternal(userObj)
          } catch (e) {
            // TODO handle
          }

          userObj.id = user.id
          userObj.balance = ledgerUser.balance

          done(null, userObj)
        })
      ))
    }

    passport.serializeUser(function(user, done) {
      done(null, user)
    })

    passport.deserializeUser(function(user, done) {
      User.findOne({where: {username: user.username}})
        .then(function(dbUser){
          dbUser.password = user.password
          done(null, dbUser)
        })
    })
  }

  attach (app) {
    // Authentication
    app.use(passport.initialize())
    app.use(passport.session())
  }

  * checkAuth (next) {
    // Local Strategy
    if (this.isAuthenticated()) {
      return yield next
    }

    // Basic Strategy
    yield passport.authenticate(['basic', 'github'], { session: false }).call(this, next)
  }
}
