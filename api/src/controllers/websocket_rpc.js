'use strict'

module.exports = WebsocketRpcControllerFactory

const ws = require('ws')
const debug = require('debug')('ilp-kit:websocket-rpc')
const Connector = require('../lib/connector')

function WebsocketRpcControllerFactory (deps) {
  const connector = deps(Connector)

  return class WebsocketRpcController {
    static init (server) {
     const socketServer = new ws.Server({
        perMessageDeflate: false,
        server
      })

      debug('listening for websocket connections')
      socketServer.on('connection', socket => {
        const url = socket.upgradeReq.url
        const params = url.match(/^\/api\/peers\/rpc\/ws\/(.+?)\/(.+?)\/?$/)
        if (!params) {
          debug('Error: no ws at "' + url + '"')
          socket.close()
          return
        }

        const [ , prefix, token ] = params
        let plugin

        try {
          plugin = connector.getPlugin(prefix)
        } catch (e) {
          debug(e)
          socket.close()
          return
        }

        if (!plugin || !plugin.isAuthorized(token)) {
          debug(`Error: prefix (${prefix}) and/or token (${token}) are incorrect`)
          socket.close()
          return
        }
        
        if (typeof plugin.addSocket === 'function') {
          plugin.addSocket(socket)
        } else {
          debug(`Error: plugin ${prefix} does not support websocket RPC`)
          socket.close()
        }
      })
    }
  }
}
