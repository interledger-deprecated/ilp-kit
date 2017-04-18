'use strict'

module.exports = PeersControllerFactory

const _ = require('lodash')
const forEach = require('co-foreach')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

PeersControllerFactory.constitute = [Auth, Config, Log, PeerFactory, Connector]
function PeersControllerFactory (auth, config, log, Peer, connector) {
  log = log('peers')

  return class PeersController {
    static init (router) {
      router.get('/peers', auth.checkAuth, this.checkAdmin, this.getAll)
      router.post('/peers', auth.checkAuth, this.checkAdmin, this.postResource)
      router.put('/peers/:id', auth.checkAuth, this.checkAdmin, this.putResource)
      router.get('/peers/:id/settlement_methods', auth.checkAuth, this.checkAdmin, this.getSettlementMethods)
      router.delete('/peers/:id', auth.checkAuth, this.checkAdmin, this.deleteResource)

      // authenticated by the plugin being connected
      router.post('/peers/rpc', this.checkPeerAuth, this.rpc)
    }

    static * checkPeerAuth (next) {
      const prefix = this.query.prefix
      const auth = this.request.headers.authorization

      if (typeof prefix !== 'string' || typeof auth !== 'string') {
        this.status = 401
        return
      }

      const [ , authToken ] = auth.match(/^Bearer (.+)$/) || []
      const plugin = connector.getPlugin(prefix)

      if (!authToken || !plugin || !plugin.isAuthorized || !plugin.isAuthorized(authToken)) {
        this.status = 401
        return
      }

      yield next
    }

    // TODO move to auth
    static * checkAdmin (next) {
      if (this.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return yield next
      }

      throw new NotFoundError()
    }

    static * getAll () {
      // TODO pagination
      const peers = yield Peer.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })

      yield forEach(peers, function * (peer) {
        let peerInfo

        try {
          peerInfo = yield connector.getPeer(peer)
        } catch (e) {
          // Couldn't get the peer for some reason
          log.err("couldn't get the peer", e.stack)
        }

        if (!peerInfo) {
          peer.online = false
          return
        }

        peer.balance = peerInfo.balance
        peer.minBalance = peerInfo.minBalance
        peer.online = peerInfo.online
      })

      this.body = _.orderBy(peers, ['online', 'created_at'], ['desc', 'desc'])
    }

    static * postResource () {
      const peer = new Peer()

      if (!this.body.hostname || !this.body.limit || !this.body.currencyCode) {
        throw new InvalidBodyError('At least one of the required fields is missing')
      }

      peer.hostname = this.body.hostname.replace(/.*?:\/\//g, '')
      peer.currencyCode = this.body.currencyCode.toUpperCase()
      peer.currencyScale = parseInt(this.body.currencyScale) || PeerFactory.DEFAULT_CURRENCY_SCALE
      peer.limit = this.body.limit * Math.pow(10, peer.currencyScale)
      peer.destination = parseInt(Math.random() * 1000000)

      yield connector.connectPeer(peer)

      this.body = yield peer.save()
    }

    static * putResource () {
      const id = this.params.id
      let peer = yield Peer.findOne({ where: { id } })
      const limit = this.body.limit

      if (!peer) throw new NotFoundError("Peer doesn't exist")
      if (!limit) throw new InvalidBodyError('Limit is not supplied')

      // Update in the db
      peer.limit = limit
      peer = Peer.fromDatabaseModel(yield peer.save())

      // Update the connector
      yield connector.removePeer(peer)
      yield connector.connectPeer(peer)

      const peerInfo = yield connector.getPeer(peer)

      peer.balance = peerInfo.balance
      peer.minBalance = peerInfo.minBalance
      peer.online = peerInfo.online

      this.body = peer
    }

    static * getSettlementMethods () {
      const id = this.params.id
      const peer = yield Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      try {
        this.body = yield connector.getSettlementMethods(peer)
      } catch (e) {
        throw new NotFoundError()
      }
    }

    static * deleteResource () {
      const id = this.params.id
      const peer = yield Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      yield connector.removePeer(peer)

      yield peer.destroy()

      this.body = this.params
    }

    static * rpc () {
      const prefix = this.query.prefix
      const method = this.query.method
      const params = this.body

      if (!prefix) throw new InvalidBodyError('Prefix is not supplied')
      if (!method) throw new InvalidBodyError('Method is not supplied')

      const plugin = connector.getPlugin(prefix)

      if (!plugin) {
        this.statusCode = 404
        this.body = 'no plugin with prefix "' + prefix + '"'
        log.debug('404\'d request for plugin with prefix "' + prefix + '"')
        return
      }

      try {
        this.body = yield plugin.receive(method, params)
      } catch (e) {
        this.statusCode = 422
        this.body = e.message
        log.err('connector.rpc() failed: ', e.stack)
      }
    }
  }
}
