'use strict'

module.exports = SettlementMethodsControllerFactory

const path = require('path')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const SettlementMethodFactory = require('../models/settlement_method')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

function SettlementMethodsControllerFactory (deps) {
  const auth = deps(Auth)
  const config = deps(Config)
  const SettlementMethod = deps(SettlementMethodFactory)

  return class SettlementMethodsController {
    static init (router) {
      router.get('/settlement_methods', this.getAll)
      router.post('/settlement_methods', auth.checkAuth, this.checkAdmin, this.postResource)
      router.put('/settlement_methods/:id', auth.checkAuth, this.checkAdmin, this.putResource)
      router.post('/settlement_methods/:id/logo', auth.checkAuth, this.checkAdmin, this.postLogoResource)
      router.delete('/settlement_methods/:id', auth.checkAuth, this.checkAdmin, this.deleteResource)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    static async getAll (ctx) {
      if (ctx.req.user && ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        // TODO pagination
        ctx.body = await SettlementMethod.findAll({
          include: [{ all: true }],
          order: [
            ['enabled', 'DESC'],
            ['created_at', 'ASC']
          ]
        })

        return
      }

      ctx.body = await SettlementMethod.findAll({
        attributes: ['name', 'type', 'logo', 'description', 'uri'],
        where: { enabled: true, name: { $ne: null } },
        order: [
          ['name', 'ASC']
        ]
      })
    }

    static async postResource (ctx) {
      const method = new SettlementMethod()

      if (['paypal', 'bitcoin', 'etherium', 'ripple', 'custom'].indexOf(ctx.body.type) === -1) {
        throw new InvalidBodyError('Unknown settlement method type')
      }

      if (['paypal', 'bitcoin', 'etherium', 'ripple'].indexOf(ctx.body.type) !== -1) {
        method.name = ctx.body.type.charAt(0).toUpperCase() + ctx.body.type.slice(1)
      }

      method.type = ctx.body.type
      method.enabled = false
      // TODO
      // method.name
      // method.logo
      // method.description
      // method.uri

      ctx.body = await method.save()
    }

    static async postLogoResource (ctx) {
      const files = ctx.body.files
      const id = ctx.params.id
      const method = await SettlementMethod.findOne({ where: { id } })

      // TODO handle the name
      method.logo = path.basename(files.file.path)

      try {
        ctx.body = SettlementMethod.fromDatabaseModel(await method.save())
      } catch (e) {
        console.log('auth.js:191', e)
      }
    }

    static async putResource (ctx) {
      const id = ctx.params.id
      const method = await SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      if (ctx.body.name !== undefined) {
        method.name = ctx.body.name
      }

      if (ctx.body.description !== undefined) {
        method.description = ctx.body.description
      }

      if (ctx.body.uri !== undefined) {
        method.uri = ctx.body.uri
      }

      if (ctx.body.enabled !== undefined) {
        method.enabled = ctx.body.enabled
      }

      if (ctx.body.options !== undefined) {
        method.options = ctx.body.options
      }

      await method.save()

      ctx.body = method
    }

    static async deleteResource (ctx) {
      const id = ctx.params.id
      const method = await SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      await method.destroy()

      ctx.body = ctx.params
    }
  }
}
