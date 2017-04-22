'use strict'

module.exports = InvitesControllerFactory

const uuid = require('uuid4')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const InviteFactory = require('../models/invite')

const NotFoundError = require('../errors/not-found-error')

InvitesControllerFactory.constitute = [Auth, Config, InviteFactory]
function InvitesControllerFactory (auth, config, Invite) {
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
    static * checkAdmin (next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      // TODO throw exception
      this.status = 404
    }

    static * getAll () {
      // TODO list could get too big
      this.body = yield Invite.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })
    }

    static * getResource () {
      const code = this.params.code

      const invite = yield Invite.findOne({ where: {code} })

      // TODO throw exception
      if (!invite) {
        this.status = 404
        return
      }

      this.body = {
        code: invite.code,
        amount: invite.amount,
        claimed: invite.claimed
      }
    }

    static * postResource () {
      const code = new Invite()
      code.amount = this.body.amount
      code.code = uuid()

      yield code.save()

      this.body = code
    }

    static * putResource () {
      this.status = 200
    }

    static * deleteResource () {
      const code = yield Invite.findOne({where: {
        code: this.params.code
      }})

      if (!code) throw new NotFoundError("Code doesn't exist")

      yield code.destroy()

      this.body = this.params
    }
  }
}
