'use strict'

module.exports = PeersControllerFactory

const forEach = require('co-foreach')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

PeersControllerFactory.constitute = [Auth, Config, PeerFactory, Connector]
function PeersControllerFactory(auth, config, Peer, connector) {
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
      const peers = yield Peer.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })

      yield forEach(peers, function * (peer) {
        const peerInfo = yield connector.getPeer(peer)

        peer.balance = peerInfo.balance
        peer.online = peerInfo.online
      })

      this.body = peers
    }

    static * postResource() {
      const peer = new Peer()

      peer.hostname = this.body.hostname
      peer.limit = this.body.limit
      peer.currency = this.body.currency
      peer.broker = this.body.broker

      const dbPeer = yield peer.save()

      yield connector.connectPeer(dbPeer)

      this.body = dbPeer
    }

    static * putResource() {
      const id = this.params.id
      let peer = yield Peer.findOne({ where: { id } })
      const limit = this.body.limit

      if (!peer) throw new NotFoundError("Peer doesn't exist")
      if (!limit) throw new InvalidBodyError('Limit is not supplied')

      // Update the connector
      yield connector.removePeer(peer)
      yield connector.connectPeer(peer)

      // Update in the db
      peer.limit = limit
      peer = Peer.fromDatabaseModel(yield peer.save())

      const peerInfo = yield connector.getPeer(peer)

      peer.balance = peerInfo.balance
      peer.online = peerInfo.online

      this.body = peer
    }

    static * deleteResource() {
      const id = this.params.id
      const peer = yield Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      yield connector.removePeer(peer)

      yield peer.destroy()

      this.body = this.params
    }
  }
}
