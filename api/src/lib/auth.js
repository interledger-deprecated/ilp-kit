"use strict"

const passport = require('koa-passport')
const LocalStrategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const UserFactory = require('../models/user')
const UnauthorizedError = require('five-bells-shared/errors/unauthorized-error')

module.exports = class Auth {
  static constitute () { return [ UserFactory ] }
  constructor (User) {
    passport.use(new BasicStrategy(
      function (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }
        User.findOne({where:{username: username}})
          .then(function (userObj) {
            if (userObj && password && userObj.password === password) {
              return done(null, userObj)
            } else {
              return done(new UnauthorizedError('Unknown or invalid account / password'))
            }
          })
      }))

    passport.use(new LocalStrategy(
      function (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }
        User.findOne({where:{username: username}})
          .then(function (userObj) {
            if (userObj && password && userObj.password === password) {
              return done(null, userObj)
            } else {
              return done(new UnauthorizedError('Unknown or invalid account / password'))
            }
          })
      }))

    passport.serializeUser(function(user, done) {
      done(null, user)
    })

    passport.deserializeUser(function(user, done) {
      User.findOne({where: {username: user.username}})
        .then(function(user){
          done(null, user)
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
    yield passport.authenticate('basic', { session: false }).call(this, next)
  }
}
