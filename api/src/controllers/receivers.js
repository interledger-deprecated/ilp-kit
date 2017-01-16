'use strict'

module.exports = ReceiversControllerFactory

const Auth = require('../lib/auth')
const SPSP = require('../lib/spsp')
const ReceiverFactory = require('../models/receiver')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

function ReceiversControllerFactory (deps) {
  const auth = deps(Auth)
  const spsp = deps(SPSP)
  const Receiver = deps(ReceiverFactory)

  function receiverToExternal (username, receiver) {
    return Object.assign(
      {},
      receiver.getDataExternal(),
      spsp.getSharedSecretForReceiver(receiver, username)
    )
  }

  return class ReceiversController {
    static init (router) {
      router.get('/receivers', auth.checkAuth, this.getAll)
      router.post('/receivers', auth.checkAuth, this.postResource)
      router.put('/receivers/:name', auth.checkAuth, this.putResource)
      router.delete('/receivers/:name', auth.checkAuth, this.deleteResource)
    }

    static async getAll (ctx) {
      const user = ctx.state.user
      // TODO pagination
      const receivers = await Receiver.findAll({
        where: { user: user.id },
        order: [['created_at', 'DESC']]
      })

      const receiversWithSecrets = await receivers
        .map(receiverToExternal.bind(null, user.username))

      ctx.body = receiversWithSecrets
    }

    static async postResource (ctx) {
      const user = ctx.state.user
      const name = ctx.body.name
      const receiver = new Receiver()

      if (!name) throw new InvalidBodyError('Name is required for new receivers')

      receiver.user = user.id
      receiver.name = name
      receiver.webhook = ctx.body.webhook

      await receiver.save()

      ctx.body = receiverToExternal(user.username, receiver)
    }

    static async putResource (ctx) {
      const user = ctx.state.user
      const name = ctx.params.name
      let receiver = await Receiver.findOne({ where: { user: user.id, name } })
      const webhook = ctx.body.webhook

      if (!receiver) throw new NotFoundError("Receiver doesn't exist")

      // Update in the db
      receiver.name = name
      receiver.webhook = webhook
      receiver = Receiver.fromDatabaseModel(await receiver.save())

      ctx.body = receiverToExternal(user.username, receiver)
    }

    static async deleteResource (ctx) {
      const user = ctx.state.user
      const name = ctx.params.name
      const receiver = await Receiver.findOne({ where: { user: user.id, name } })

      if (!receiver) throw new NotFoundError("Receiver doesn't exist")

      await receiver.destroy()

      ctx.body = ctx.params
    }
  }
}
