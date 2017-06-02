/* globals webpackIsomorphicTools */

import Express from 'express'
import React from 'react'
import ReactDOM from 'react-dom/server'
import config from './config'
import favicon from 'serve-favicon'
import compression from 'compression'
import httpProxy from 'http-proxy'
import path from 'path'
import createStore from './redux/store'
import ApiClient from './helpers/ApiClient'
import Html from './helpers/Html'
import PrettyError from 'pretty-error'
import http from 'http'
import forceSSL from 'express-force-ssl'
import url from 'url'

import { match } from 'react-router'
import { ReduxAsyncConnect, loadOnServer } from 'redux-connect'
import createHistory from 'react-router/lib/createMemoryHistory'
import {Provider} from 'react-redux'
import getRoutes from './routes'

const targetUrl = 'http://' + config.apiHost + ':' + config.apiPort
const pretty = new PrettyError()
const app = new Express()
const server = new http.Server(app)

const proxyApi = httpProxy.createProxyServer({
  target: targetUrl,
  ws: true
})
const proxyLedger = httpProxy.createProxyServer({
  target: config.ledgerUri,
  ws: true
})

if (['true', '1'].indexOf(process.env.WALLET_FORCE_HTTPS) !== -1) {
  console.info('forcing HTTPS enabled')
  app.set('forceSSLOptions', {
    enable301Redirects: true,
    trustXFPHeader: ['true', '1'].indexOf(process.env.WALLET_TRUST_XFP_HEADER) !== -1
  })
  app.use(forceSSL)
}

app.use(compression())
app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.png')))

app.use(Express.static(path.join(__dirname, '..', 'static')))

// Proxy to API server
app.use('/api', (req, res) => {
  proxyApi.web(req, res, {target: targetUrl})
})

app.use('/.well-known/webfinger', (req, res) => {
  proxyApi.web(req, res, {target: targetUrl + '/webfinger'})
})

server.on('upgrade', (req, socket, head) => {
  let u = url.parse(req.url).pathname.split('/')[1]

  if (u === 'api') {
    proxyApi.ws(req, socket, head, {target: targetUrl + '/socket.io'})
  }

  if (u === 'ledger') {
    const parsedUrl = url.parse(req.url)

    // TODO /ledger shouldn't be hardcoded here
    parsedUrl.pathname = parsedUrl.pathname.replace('/ledger', '')
    req.url = url.format(parsedUrl)

    proxyLedger.ws(req, socket, head)
  }
})

// added the error handling to avoid https://github.com/nodejitsu/node-http-proxy/issues/527
proxyApi.on('error', (error, req, res) => {
  let json
  if (error.code !== 'ECONNRESET' && error.code !== 'ECONNREFUSED') {
    console.error('proxy error', error)
  }
  // if (!res.headersSent) {
  //   res.writeHead(500, {'content-type': 'application/json'})
  // }

  json = {error: 'server_error', reason: 'API is unavailable'}
  res.end(JSON.stringify(json))
})

// Proxy to ledger
app.use('/ledger', (req, res) => {
  proxyLedger.web(req, res)
})

// added the error handling to avoid https://github.com/nodejitsu/node-http-proxy/issues/527
proxyLedger.on('error', (error, req, res) => {
  let json
  if (error.code !== 'ECONNRESET') {
    console.error('proxy error', error)
  }
  // if (!res.headersSent) {
  //   res.writeHead(500, {'content-type': 'application/json'})
  // }

  json = {error: 'server_error', reason: 'Ledger is unavailable'}
  res.end(JSON.stringify(json))
})

app.use((req, res) => {
  if (__DEVELOPMENT__) {
    // Do not cache webpack stats: the script file would change since
    // hot module replacement is enabled in the development env
    webpackIsomorphicTools.refresh()
  }
  const client = new ApiClient(req)
  const history = createHistory(req.originalUrl)

  const store = createStore(history, client)

  function hydrateOnClient () {
    res.send('<!doctype html>\n' +
      ReactDOM.renderToString(<Html assets={webpackIsomorphicTools.assets()} store={store} />))
  }

  if (__DISABLE_SSR__) {
    hydrateOnClient()
    return
  }

  match({ history, routes: getRoutes(store), location: req.originalUrl }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (error) {
      console.error('ROUTER ERROR:', pretty.render(error))
      res.status(500)
      hydrateOnClient()
    } else if (renderProps) {
      loadOnServer({...renderProps, store, helpers: {client}}).then(() => {
        const component = (
          <Provider store={store} key='provider'>
            <ReduxAsyncConnect {...renderProps} />
          </Provider>
        )

        res.status(200)

        global.navigator = {userAgent: req.headers['user-agent']}

        res.send('<!doctype html>\n' +
          ReactDOM.renderToString(<Html assets={webpackIsomorphicTools.assets()} component={component} store={store} />))
      })
    } else {
      res.status(404).send('Not found')
    }
  })
})

if (config.port) {
  server.listen(config.port, (err) => {
    if (err) {
      console.error(err)
    }
    console.info('----\n==> %s is running, talking to API server on %s.', 'ILP Kit', config.apiPort)
    console.info('==> Open http://%s:%s in a browser to view the app.', config.host, config.port)
  })
} else {
  console.error('==> ERROR: No PORT environment variable has been specified')
}
