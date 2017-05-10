'use strict'

module.exports = PeersControllerFactory

const _ = require('lodash')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Connector = require('../lib/connector')
const PeerFactory = require('../models/peer')

const NotFoundError = require('../errors/not-found-error')
const InvalidBodyError = require('../errors/invalid-body-error')

function PeersControllerFactory (deps) {
  const auth = deps(Auth)
  const config = deps(Config)
  const log = deps(Log)('peers')
  const Peer = deps(PeerFactory)
  const connector = deps(Connector)

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

    static async checkPeerAuth (ctx, next) {
      const prefix = ctx.query.prefix
      const auth = ctx.request.headers.authorization

      if (typeof prefix !== 'string' || typeof auth !== 'string') {
        ctx.status = 401
        return
      }

      const [ , authToken ] = auth.match(/^Bearer (.+)$/) || []
      const plugin = connector.getPlugin(prefix)

      if (!authToken || !plugin || !plugin.isAuthorized || !plugin.isAuthorized(authToken)) {
        ctx.status = 401
        return
      }

      await next()
    }

    // TODO move to auth
    static async checkAdmin (ctx, next) {
      if (ctx.req.user.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        return next()
      }

      throw new NotFoundError()
    }

    static async getAll (ctx) {
      console.log('peers reached')
      // TODO pagination
      const peers = await Peer.findAll({
        include: [{ all: true }],
        order: [['created_at', 'DESC']]
      })

      await Promise.all(peers.map(async function (peer) {
        let peerInfo

        try {
          peerInfo = await connector.getPeer(peer)
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
      }))

      ctx.body = _.orderBy(peers, ['online', 'created_at'], ['desc', 'desc'])
    }

    static async postResource (ctx) {
      const peer = new Peer()

      if (!ctx.body.hostname || !ctx.body.limit || !ctx.body.currencyCode) {
        throw new InvalidBodyError('At least one of the required fields is missing')
      }

      peer.hostname = ctx.body.hostname.replace(/.*?:\/\//g, '')
      peer.currencyCode = ctx.body.currencyCode.toUpperCase()
      peer.currencyScale = parseInt(ctx.body.currencyScale) || PeerFactory.DEFAULT_CURRENCY_SCALE
      peer.limit = ctx.body.limit * Math.pow(10, peer.currencyScale)
      peer.destination = parseInt(Math.random() * 1000000)

      await connector.connectPeer(peer)

      ctx.body = await peer.save()
    }

    static async putResource (ctx) {
      const id = ctx.params.id
      let peer = await Peer.findOne({ where: { id } })
      const limit = ctx.body.limit

      if (!peer) throw new NotFoundError("Peer doesn't exist")
      if (!limit) throw new InvalidBodyError('Limit is not supplied')

      // Update in the db
      peer.limit = limit
      peer = Peer.fromDatabaseModel(await peer.save())

      // Update the connector
      await connector.removePeer(peer)
      await connector.connectPeer(peer)

      const peerInfo = await connector.getPeer(peer)

      peer.balance = peerInfo.balance
      peer.minBalance = peerInfo.minBalance
      peer.online = peerInfo.online

      ctx.body = peer
    }

    static async getSettlementMethods (ctx) {
      const id = ctx.params.id
      const peer = await Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      try {
        ctx.body = await connector.getSettlementMethods(peer)
      } catch (e) {
        throw new NotFoundError()
      }
    }

    static async deleteResource (ctx) {
      const id = ctx.params.id
      const peer = await Peer.findOne({ where: { id } })

      if (!peer) throw new NotFoundError("Peer doesn't exist")

      await connector.removePeer(peer)

      await peer.destroy()

      ctx.body = ctx.params
    }

    static async rpc (ctx) {
      const prefix = ctx.query.prefix
      const method = ctx.query.method
      const params = ctx.body

      if (!prefix) throw new InvalidBodyError('Prefix is not supplied')
      if (!method) throw new InvalidBodyError('Method is not supplied')

      const plugin = connector.getPlugin(prefix)

      if (!plugin) {
        ctx.statusCode = 404
        ctx.body = 'no plugin with prefix "' + prefix + '"'
        log.debug('404\'d request for plugin with prefix "' + prefix + '"')
        return
      }

      try {
        ctx.body = await plugin.receive(method, params)
      } catch (e) {
        ctx.statusCode = 422
        ctx.body = e.message
        log.err('connector.rpc() failed: ', e.stack)
      }
    }
  }
}
