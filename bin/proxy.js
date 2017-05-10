#!/usr/bin/env node
require('./env').normalizeEnv()

const fs = require('fs')
const path = require('path')
const HttpProxy = require('http-proxy')

const SNAKEOIL_CERT_PATH = path.resolve(__dirname, '../assets/snakeoil/cert.pem')
const SNAKEOIL_KEY_PATH = path.resolve(__dirname, '../assets/snakeoil/key.pem')

console.log('starting proxies on ports 80 and 443')

const httpProxy = HttpProxy.createServer({
  target: {
    host: 'localhost',
    port: 3010
  },
  ssl: {
    key: fs.readFileSync(SNAKEOIL_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(SNAKEOIL_CERT_PATH, 'utf8')
  },
  ws: true
}).listen(443)

const httpsProxy = HttpProxy.createServer({
  target: {
    host: 'localhost',
    port: 3010
  },
  ws: true
}).listen(80)

function handleError (err, req, res) {
  console.error(err)

  if (res && typeof res.writeHead === 'function') {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    })

    res.end('ilp-kit proxy error: ' + err)
  }
}
httpProxy.on('error', handleError)
httpsProxy.on('error', handleError)
