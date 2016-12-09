'use strict'

module.exports = PeersControllerFactory

const Auth = require('../lib/auth')
const Config = require('../lib/config')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')

PeersControllerFactory.constitute = [Auth, Config, PeerFactory]
function PeersControllerFactory(auth, config, Peer) {
  return class PeersController {
    static init(router) {
      router.get('/peers', auth.checkAuth, this.checkAdmin, this.getAll)
      router.post('/peers', auth.checkAuth, this.checkAdmin, this.postResource)
      router.put('/peers/:id', auth.checkAuth, this.checkAdmin, this.putResource)
      router.delete('/peers/:id', auth.checkAuth, this.checkAdmin, this.deleteResource)
    }

    // TODO move to auth
    static * checkAdmin(next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      // TODO throw exception
      this.status = 404
    }

    static * getAll() {
      // TODO pagination
      this.body = yield Peer.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })
    }

    static * getResource() {
      const id = this.params.id

      const peer = yield Peer.findOne({ where: { id } })

      // TODO throw exception instead of status = 404
      return peer ? this.body = peer : this.status = 404
    }

    static * postResource() {
      const peer = new Peer()

      peer.hostname = this.body.hostname
      peer.limit = this.body.limit
      peer.currency = this.body.currency
      peer.broker = this.body.broker

      this.body = yield peer.save()
    }

    static * putResource() {
      // TODO implement editing
      this.status = 200
    }

    static * deleteResource() {
      const id = this.params.id
      const peer = yield Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      yield peer.destroy()

      this.body = this.params
    }
  }
}
