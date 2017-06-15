'use strict'

module.exports = SettlementMethodsControllerFactory

const body = require('koa-body')
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
      router.post('/settlement_methods/:id/logo',
        body({
          multipart: true,
          formidable: {
            uploadDir: path.resolve(__dirname, '../../../uploads')
          }
        }),
        auth.checkAuth,
        this.checkAdmin,
        this.postLogoResource)
      router.delete('/settlement_methods/:id', auth.checkAuth, this.checkAdmin, this.deleteResource)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    /**
     * @api {GET} /settlement_methods Get all settlement methods
     * @apiName GetSettlementMethods
     * @apiGroup SettlementMethod
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Get all settlement methods
     *
     * @apiExample {shell} Get all settlement methods
     *    curl -X GET -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/settlement_methods
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    [
     *      {
     *        "name": "Paypal",
     *        "type": "paypal",
     *        "logo": null,
     *        "description": null,
     *        "uri": null,
     *        "logoUrl": "https://wallet1.com/paypal.png"
     *      }
     *    ]
     */
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

    /**
     * @api {POST} /settlement_methods Add a settlement method
     * @apiName PostSettlementMethods
     * @apiGroup SettlementMethod
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Add a settlement method
     *
     * @apiExample {shell} Add a settlement method
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -d
     *    '{
     *        "type": "Paypal"
     *    }'
     *    https://wallet.example/peers
     *
     * @apiSuccessExample {json} 201 Response:
     *    HTTP/1.1 201 OK
     *    {
     *        "id": "2e0e85a6-64f1-4c57-aee4-898237a27486",
     *        "name": "Paypal",
     *        "type": "paypal",
     *        "enabled": false,
     *        "updated_at": "2017-06-14T17:52:20.742Z",
     *        "created_at": "2017-06-14T17:52:20.742Z",
     *        "logo": null,
     *        "description": null,
     *        "uri": null,
     *        "options": null
     *    }
     */
    static async postResource (ctx) {
      const method = new SettlementMethod()

      if (['paypal', 'cash', 'bitcoin', 'ethereum', 'ripple', 'custom'].indexOf(ctx.body.type) === -1) {
        throw new InvalidBodyError('Unknown settlement method type')
      }

      if (['paypal', 'cash', 'bitcoin', 'ethereum', 'ripple'].indexOf(ctx.body.type) !== -1) {
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
      const id = ctx.params.id
      const file = ctx.request.body.files && ctx.request.body.files.file

      if (!file) throw new InvalidBodyError("Request doesn't include an image file")

      const method = await SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      // TODO handle the name
      method.logo = path.basename(file.path)

      try {
        ctx.body = SettlementMethod.fromDatabaseModel(await method.save())
      } catch (e) {
        console.log('auth.js:191', e)
      }
    }

    /**
     * @api {put} /settlement_methods/:id Update settlement method
     * @apiName PutSettlementMethods
     * @apiGroup SettlementMethod
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Update settlement method
     *
     * @apiParam {UUID} id Settlement Method id
     *
     * @apiExample {shell} Update settlement method
     *    curl -X PUT -H "Authorization: Basic YWxpY2U6YWxpY2U=" -d
     *    '{
     *        "enabled": true
     *    }'
     *    https://wallet.example/settlement_methods/2e0e85a6-64f1-4c57-aee4-898237a27486
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *        "id": "2e0e85a6-64f1-4c57-aee4-898237a27486",
     *        "name": "Paypal",
     *        "type": "paypal",
     *        "enabled": true,
     *        "updated_at": "2017-06-14T17:52:20.742Z",
     *        "created_at": "2017-06-14T17:52:20.742Z",
     *        "logo": null,
     *        "description": null,
     *        "uri": null,
     *        "options": null
     *    }
     */
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

    /**
     * @api {delete} /settlement_methods/:id Delete settlement method
     * @apiName DeleteSettlementMethod
     * @apiGroup SettlementMethod
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiParam {UUID} id Settlement Method id
     *
     * @apiDescription Delete Settlement Method
     *
     * @apiExample {shell} Delete Settlement Method
     *    curl -X DELETE -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/settlement_methods/2e0e85a6-64f1-4c57-aee4-898237a27486
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 204 OK
     */
    static async deleteResource (ctx) {
      const id = ctx.params.id
      const method = await SettlementMethod.findOne({ where: { id } })

      if (!method) throw new NotFoundError("Settlement method doesn't exist")

      await method.destroy()

      ctx.body = ctx.params
    }
  }
}
