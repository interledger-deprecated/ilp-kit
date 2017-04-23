'use strict'

const crypto = require('crypto')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
const UnauthorizedError = require('five-bells-shared/errors/unauthorized-error')

const LocalStrategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const GitHubStrategy = require('passport-github').Strategy

const Config = require('./config')
const Ledger = require('./ledger')

module.exports = class Auth {
  constructor (deps) {
    const self = this
    const User = self.User = deps(UserFactory)
    const config = self.config = deps(Config)
    const ledger = self.ledger = deps(Ledger)

    self.commonSetup(BasicStrategy)
    self.commonSetup(LocalStrategy)

    // TODO add an environment variable to disable github login, it should be optional
    // TODO changing password on a GitHub auth makes it impossible to login with github again
    if (config.data.getIn(['github', 'client_id'])) {
      passport.use(new GitHubStrategy(
        {
          clientID: config.data.getIn(['github', 'client_id']),
          clientSecret: config.data.getIn(['github', 'client_secret']),
          callbackURL: config.data.getIn(['server', 'base_uri']) + '/auth/github/callback'
        },
        // TODO this whole function is a dup from local register flow
        async function (accessToken, refreshToken, profile, done) {
          const email = profile.emails[0] && profile.emails[0].value
          const name = profile.displayName
          const profilePic = profile.photos[0].value

          // Find a user by github id or email address
          let dbUser = await User.findOne({
            where: {
              $or: [
                { github_id: profile.id },
                { email: email }
              ]
            }
          })

          // User exists
          if (dbUser) {
            dbUser.password = self.generateGithubPassword(profile.id)
            dbUser.github_id = profile.id

            if (!dbUser.name) {
              dbUser.name = name
            }

            if (!dbUser.profile_picture) {
              dbUser.profile_picture = profilePic
            }

            return done(null, dbUser)
          }

          const username = await self.User.getAvailableUsername(profile.username)

          // User doesn't exist
          const userObj = {
            // TODO:UX users should be able to change their username
            username,
            password: self.generateGithubPassword(profile.id),
            email: email,
            email_verified: true,
            name: name,
            github_id: profile.id,
            profile_picture: profilePic
          }

          // Create the ledger account
          let ledgerUser
          try {
            ledgerUser = await ledger.createAccount(userObj)
          } catch (e) {
            // TODO handle
            console.log('auth.js:80', e)
          }

          userObj.account = ledgerUser.id

          // Create the db user
          try {
            dbUser = User.fromDatabaseModel(await User.createExternal(userObj))
          } catch (e) {
            // TODO handle
            console.log('auth.js:80', e)
          }

          // Append ledger account
          const user = await dbUser.appendLedgerAccount(ledgerUser)

          user.password = self.generateGithubPassword(profile.id)

          return done(null, user)
        })
      )
    }

    passport.serializeUser((user, done) => {
      return done(null, user)
    })

    passport.deserializeUser((userObj, done) => {
      User.findOne({where: {username: userObj.username}})
        .then(async function (dbUser) {
          if (!dbUser) {
            return done(new UnauthorizedError('Unknown or invalid account / password'))
          }

          let user = User.fromDataPersistent(dbUser)
          user = await user.appendLedgerAccount()
          user.password = userObj.password

          done(null, user)
        })
        .catch(done)
    })
  }

  attach (app) {
    // Authentication
    app.use(passport.initialize())
    app.use(passport.session())
  }

  async checkAuth (ctx, next) {
    // Local Strategy
    if (ctx.isAuthenticated()) {
      return next()
    }

    // Basic and OAuth strategies
    return passport.authenticate(['basic'], { session: false })(ctx, next)
  }

  commonSetup (Strategy) {
    const self = this

    passport.use(new Strategy(
      async function (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }

        // Check if the db user exists
        const dbUser = await self.User.findOne({where: {
          $or: [
            { username: username },
            { email: username }
          ]
        }})

        if (!dbUser) {
          return done(new UnauthorizedError('Unknown or invalid account / password'))
        }

        // Get the ledger user
        // TODO do we need this check?
        let ledgerUser
        try {
          ledgerUser = await self.ledger.getAccount({
            username: dbUser.username,
            password: password
          })
        } catch (e) {
          return done(new UnauthorizedError('Unknown or invalid account / password'))
        }

        // Append ledger account
        const user = await dbUser.appendLedgerAccount(ledgerUser)
        user.password = password

        return done(null, user)
      }
    ))
  }

  generateGithubPassword (userId) {
    return crypto.createHmac('sha256', this.config.data.getIn(['github', 'secret'])).update(userId).digest('base64')
  }
}
