#!/usr/bin/env node
require('../env').normalizeEnv()

const fs = require('fs')
const path = require('path')
const express = require('express')
const HttpProxy = require('http-proxy')
const https = require('https')
const http = require('http')
const url = require('url')
const env = process.env

const setupProxy = (path, target) => {
  const proxy = HttpProxy.createProxyServer({
    target,
    ws: true
  })

  proxy.on('error', (error, req, res) => {
    let json
    if (error.code !== 'ECONNRESET' && error.code !== 'ECONNREFUSED') {
      console.error('proxy error', error)
    }

    json = {error: 'server_error', reason: (path || 'client') + ' is unavailable'}
    res.end(JSON.stringify(json))
  })

  app.use('/' + path, (req, res) => {
    proxy.web(req, res, { target })
  })

  return proxy
}

const setupWebsocket = server => {
  server.on('upgrade', (req, socket, head) => {
    let u = url.parse(req.url).pathname.split('/')[1]

    const parsedUrl = url.parse(req.url)

    if (u === 'api') {
      parsedUrl.pathname = parsedUrl.pathname.replace('/api', '')
      req.url = url.format(parsedUrl)

      proxyA.ws(req, socket, head)
    }

    if (u === 'ledger') {
      parsedUrl.pathname = parsedUrl.pathname.replace('/ledger', '')
      req.url = url.format(parsedUrl)

      proxyL.ws(req, socket, head)
    }
  })
}

const app = new express()

// Ledger proxy
const lUrl = 'http://' + env.LEDGER_HOSTNAME + ':' + env.LEDGER_PORT
const proxyL = setupProxy('ledger', lUrl)

// Api proxy
const aUrl = 'http://' + env.API_HOSTNAME + ':' + env.API_PORT
const proxyA = setupProxy('api', aUrl)

// Webfinger proxy
app.use('/.well-known/webfinger', (req, res) => {
  proxyA.web(req, res, { target: aUrl + '/webfinger' })
})

if (env.NODE_ENV === 'production') {
  // Static files (Web Client)
  app.use(express.static(path.resolve(__dirname, '../client/build')))
} else {
  // Client proxy
  const cUrl = 'http://' + env.CLIENT_HOST + ':' + env.CLIENT_PORT
  setupProxy('', cUrl)
}

// Servers
const cert = env.WALLET ? `./${env.WALLET}.com.pem` : './wallet1.com.pem'
const httpServer = http.createServer(app)
const httpsServer = https.createServer({
  key: fs.readFileSync(cert),
  cert: fs.readFileSync(cert)
}, app)

// WebSockets
setupWebsocket(httpServer)
setupWebsocket(httpsServer)

// Start
httpServer.listen(80)
httpsServer.listen(443)

console.log('Started a webserver on ports 80 and 443')
