import passport from 'koa-passport'
//import { BasicStrategy } from 'passport-http'
import LocalStrategy from 'passport-local'
import { Strategy } from 'passport-anonymous'
import UserFactory from '../models/user'
import UnauthorizedError from 'five-bells-shared/errors/unauthorized-error'

export default class Auth {
  static constitute () { return [ UserFactory ] }
  constructor (User) {
    passport.use(new LocalStrategy(
      function (username, password, done) {
        // If no Authorization is provided we can still
        // continue without throwing an error
        if (!username) {
          return done(null, false)
        }
        User.findOne({where:{name: username}})
          .then(function (userObj) {
            if (userObj && password && userObj.password === password) {
              return done(null, userObj)
            } else {
              return done(new UnauthorizedError('Unknown or invalid account / password'))
            }
          })
      }))

    //passport.use(new Strategy())

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

  async isAuth (next){
    if (this.isAuthenticated()){
      await next
    } else {
      console.log('no auth')
    }
  }
}