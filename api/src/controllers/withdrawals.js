'use strict'

module.exports = WithdrawalsControllerFactory

const Auth = require('../lib/auth')
const Config = require('../lib/config')
const Pay = require('../lib/pay')
const WithdrawalFactory = require('../models/withdrawal')
const NotFoundError = require('../errors/not-found-error')

function WithdrawalsControllerFactory (deps) {
  const auth = deps(Auth)
  const config = deps(Config)
  const pay = deps(Pay)
  const Withdrawal = deps(WithdrawalFactory)

  return class WithdrawalsController {
    static init (router) {
      router.post('/withdrawals/:id', auth.checkAuth, this.postResource)

      // Admin
      router.get('/withdrawals', auth.checkAuth, this.checkAdmin, this.getAll)
      router.put('/withdrawals/:id', auth.checkAuth, this.checkAdmin, this.putResource)
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    static async getAll (ctx) {
      // TODO pagination
      // TODO don't return all of the fields / associations
      ctx.body = await Withdrawal.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })
    }

    static async putResource (ctx) {
      const id = ctx.params.id
      const data = ctx.body

      const withdrawal = await Withdrawal.findOne({ where: { id } })

      if (!withdrawal) throw new NotFoundError()

      if (data.status !== undefined) {
        withdrawal.status = data.status
      }

      ctx.body = await withdrawal.save()
    }

    static async postResource (ctx) {
      await pay.withdraw(ctx.req.user, ctx.body.amount)
    }
  }
}
