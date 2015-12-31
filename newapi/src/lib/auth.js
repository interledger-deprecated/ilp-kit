import passport from 'koa-passport'
import { BasicStrategy } from 'passport-http'
import { Strategy } from 'passport-anonymous'
import UserFactory from '../models/user'
import UnauthorizedError from 'five-bells-shared/errors/unauthorized-error'

export default class Auth {
  static constitute () { return [ UserFactory ] }
  constructor (User) {
    passport.use(new BasicStrategy(
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

    passport.use(new Strategy())
  }
}