#!/usr/bin/env node
'use strict'

const localtunnel = require('localtunnel')
const debug = require('debug')('localtunnel')
require('./normalizeEnv')

const reconnector = (port, host) => {
  return setTimeout.bind(null, connect.bind(null, port, host), 2000)
}

const connect = (port, host) => {
  const subdomain = host.replace(/\.localtunnel\.me$/, '')
  const reconnect = reconnector(port, host)
  try {
    const tunnel = localtunnel(port, { subdomain }, (err, tunnel) => {
      if (err) {
        reconnect()
        return
      }

      debug('connected localtunnel to', tunnel.url)
      tunnel.on('close', reconnect)
      tunnel.on('error', reconnect)
    })
  } catch (err) {
    debug('Error occurred:', err.message, 'Restarting localtunnel.')
    reconnect()
  }  
}

// if the hostname is a subdomain of "localtunnel.me"
if (process.env.CLIENT_HOST.match(/\.localtunnel\.me$/)) {
  console.log('creating localtunnel to ', process.env.CLIENT_HOST)
  connect(process.env.CLIENT_PORT, process.env.CLIENT_HOST)
} else {
  process.exit(0)
}
