const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UserFactory = require('../models/user')
import Auth from '../lib/auth'
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')
import UnauthorizedError from 'five-bells-shared/errors/unauthorized-error'

UsersControllerFactory.constitute = [UserFactory, Auth, Log, DB, Config]
export default function UsersControllerFactory (User, auth, log, db, config) {
  log = log('users')

  return class UsersController {
    static init (router) {
      //router.get('/users/:id', auth.isAuth, this.getResource)
      //router.put('/users/:id', User.createBodyParser(), this.putResource)
    }

    static async getResource () {
      let id = this.params.id
      request.validateUriParameter('id', id, 'Identifier')
      id = id.toLowerCase()
      log.debug('fetching user ID ' + id)

      let can_modify = this.req.user.name === id
      if (!can_modify) {
        throw new UnauthorizedError('You don\'t have permission to examine this user')
      }

      const user = await User.findOne({where: {name: id}})
      if (!user) {
        throw new NotFoundError('Unknown user ID')
      }

      delete user.password

      this.body = user.getDataExternal()
    }

    static async putResource () {
      const self = this
      let id = this.params.id || ''
      request.validateUriParameter('id', id, 'Identifier')
      id = id.toLowerCase()

      // SQLite's implementation of upsert does not tell you whether it created the
      // row or whether it already existed. Since we need to know to return the
      // correct HTTP status code we unfortunately have to do this in two steps.
      let existed
      await db.transaction(async function (transaction) {
        existed = await User.findOne({where: {name: id}}, { transaction })
        if (existed) {
          existed.setDataExternal(self.body)
          await existed.save({ transaction })
        } else {
          await User.createExternal(self.body, { transaction })
        }
      })

      log.debug((existed ? 'updated' : 'created') + ' user ID ' + id)

      this.body = this.body.getDataExternal()
      this.status = existed ? 200 : 201
    }
  }
}