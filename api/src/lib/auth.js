"use strict"

const passport = require('koa-passport')
const LocalStrategy = require('passport-local')
const UserFactory = require('../models/user')
const UnauthorizedError = require('five-bells-shared/errors/unauthorized-error')

module.exports = class Auth {
  static constitute () { return [ UserFactory ] }
  constructor (User) {
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
      done(null, user)
    })
  }

  attach (app) {
    // Authentication
    app.use(passport.initialize())
    app.use(passport.session())
  }

  * isAuth (next){
    if (this.isAuthenticated()){
      yield next
    } else {
      this.status = 404
    }
  }
}