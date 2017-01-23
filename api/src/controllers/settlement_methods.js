'use strict'

module.exports = SettlementMethodsControllerFactory

const path = require('path')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const SettlementMethodFactory = require('../models/settlement_method')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

SettlementMethodsControllerFactory.constitute = [Auth, Config, Log, SettlementMethodFactory]
function SettlementMethodsControllerFactory(auth, config, log, SettlementMethod) {
  log = log('settlement_methods')

  return class SettlementMethodsController {
    static init(router) {
      router.get('/settlement_methods', auth.checkAuth, this.checkAdmin, this.getAll)
      router.post('/settlement_methods', auth.checkAuth, this.checkAdmin, this.postResource)
      router.put('/settlement_methods/:id', auth.checkAuth, this.checkAdmin, this.putResource)
      router.post('/settlement_methods/:id/logo', auth.checkAuth, this.checkAdmin, this.postLogoResource)
      router.delete('/settlement_methods/:id', auth.checkAuth, this.checkAdmin, this.deleteResource)
    }

    // TODO move to auth
    static * checkAdmin(next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      throw new NotFoundError()
    }

    static * getAll() {
      // TODO pagination
      this.body = yield SettlementMethod.findAll({
        include: [{ all: true }],
        order: [
          ['enabled', 'DESC NULLS LAST'],
          ['created_at', 'ASC']
        ]
      })
    }

    static * postResource() {
      const method = new SettlementMethod()

      if (['paypal', 'bitcoin', 'etherium', 'ripple', 'custom'].indexOf(this.body.type) === -1) {
        throw new InvalidBodyError('Unknown settlement method type')
      }

      method.type = this.body.type
      // TODO
      // method.name
      // method.logo
      // method.description
      // method.uri

      this.body = yield method.save()
    }

    static * postLogoResource() {
      const files = this.body.files
      const id = this.params.id
      const method = yield SettlementMethod.findOne({ where: { id } })

      // TODO handle the name
      method.logo = path.basename(files.file.path)

      try {
        yield method.save()
      } catch (e) {
        console.log('auth.js:191', e)
      }

      this.body = method
    }

    static * putResource() {
      const id = this.params.id
      const method = yield SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      if (this.body.name !== undefined) {
        method.name = this.body.name
      }

      if (this.body.description !== undefined) {
        method.description = this.body.description
      }

      if (this.body.uri !== undefined) {
        method.uri = this.body.uri
      }

      if (this.body.enabled !== undefined) {
        method.enabled = this.body.enabled
      }

      yield method.save()

      this.body = method
    }

    static * deleteResource() {
      const id = this.params.id
      const method = yield SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      yield method.destroy()

      this.body = this.params
    }
  }
}
