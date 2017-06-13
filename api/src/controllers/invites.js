'use strict'

module.exports = InvitesControllerFactory

const uuid = require('uuid4')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const InviteFactory = require('../models/invite')

const NotFoundError = require('../errors/not-found-error')

function InvitesControllerFactory (deps) {
  const auth = deps(Auth)
  const config = deps(Config)
  const Invite = deps(InviteFactory)

  return class InvitesController {
    static init (router) {
      router.get('/invites', auth.checkAuth, this.checkAdmin, this.getAll)
      router.post('/invites', auth.checkAuth, this.checkAdmin, this.postResource)
      router.delete('/invites/:code', auth.checkAuth, this.checkAdmin, this.deleteResource)

      // Public
      router.get('/invites/:code', this.getResource)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      // TODO throw exception
      ctx.status = 404
    }

    /**
     * @api {get} /invites Get all invite codes
     * @apiName GetInvites
     * @apiGroup Invites
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Get all invite codes
     *
     * @apiExample {shell} Get all invite codes
     *    curl -X GET -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/invites
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    [
     *      {
     *        "code": "6a6a7ebc-0e18-49d3-8c9c-646caa56f213",
     *        "amount": 100,
     *        "claimed": false,
     *        "created_at": "2017-05-11T22:51:32.737Z",
     *        "updated_at": "2017-05-11T22:51:32.737Z",
     *        "user_id": null,
     *        "User": null
     *     },
     *     {
     *        "code": "2cd765ce-4b15-4e40-99a0-fa4cd8ddce93",
     *        "amount": 200,
     *         "claimed": false,
     *         "created_at": "2017-05-11T22:51:21.642Z",
     *         "updated_at": "2017-05-11T22:51:21.642Z",
     *         "user_id": null,
     *         "User": null
     *     }
     *   ]
     */
    static async getAll (ctx) {
      // TODO list could get too big
      ctx.body = await Invite.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })
    }

    /**
     * @api {get} /invites Get an invite code
     * @apiName GetInvite
     * @apiGroup Invites
     * @apiVersion 1.0.0
     *
     * @apiDescription Get an invite code
     *
     * @apiExample {shell} Get an invite code
     *    curl -X GET
     *    https://wallet.example/invites/6a6a7ebc-0e18-49d3-8c9c-646caa56f213
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *        "code": "6a6a7ebc-0e18-49d3-8c9c-646caa56f213",
     *        "amount": 100,
     *        "claimed": false
     *    }
     */
    static async getResource (ctx) {
      const code = ctx.params.code

      const invite = await Invite.findOne({ where: {code} })

      // TODO throw exception
      if (!invite) {
        ctx.status = 404
        return
      }

      ctx.body = {
        code: invite.code,
        amount: invite.amount,
        claimed: invite.claimed
      }
    }

    /**
     * @api {post} /invites Create an invite code
     * @apiName PostInvites
     * @apiGroup Invites
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiDescription Create an invite code
     *
     * @apiExample {shell} Create an invite code
     *    curl -X POST -H "Authorization: Basic YWxpY2U6YWxpY2U=" -d
     *    '{
     *        "amount": "1000"
     *    }'
     *    https://wallet.example/invites
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 201 OK
     *    {
     *        "amount": 1000,
     *        "code": "eaee4ea6-d5a4-4cd8-b78e-97a34374352c"
     *    }
     */
    static async postResource (ctx) {
      const code = new Invite()
      code.amount = ctx.body.amount
      code.code = uuid()

      await code.save()

      ctx.body = code
      ctx.status = 201
    }

    /**
     * @api {delete} /invites/:code Delete invite code
     * @apiName DeleteInvites
     * @apiGroup Invites
     * @apiVersion 1.0.0
     * @apiPermission admin
     *
     * @apiParam {String} code Invite code (uuid)
     *
     * @apiDescription Delete invite code
     *
     * @apiExample {shell} Delete invite code
     *    curl -X DELETE -H "Authorization: Basic YWxpY2U6YWxpY2U="
     *    https://wallet.example/invites/eaee4ea6-d5a4-4cd8-b78e-97a34374352c
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 204 OK
     */
    static async deleteResource (ctx) {
      const code = await Invite.findOne({where: {
        code: ctx.params.code
      }})

      if (!code) throw new NotFoundError("Code doesn't exist")

      await code.destroy()

      ctx.body = null
    }
  }
}
