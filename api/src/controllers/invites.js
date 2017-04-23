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
      router.put('/invites/:code', auth.checkAuth, this.checkAdmin, this.putResource)
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

    static async getAll (ctx) {
      // TODO list could get too big
      ctx.body = await Invite.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })
    }

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

    static async postResource (ctx) {
      const code = new Invite()
      code.amount = ctx.body.amount
      code.code = uuid()

      await code.save()

      ctx.body = code
    }

    static async putResource (ctx) {
      ctx.status = 200
    }

    static async deleteResource (ctx) {
      const code = await Invite.findOne({where: {
        code: ctx.params.code
      }})

      if (!code) throw new NotFoundError("Code doesn't exist")

      await code.destroy()

      ctx.body = ctx.params
    }
  }
}
