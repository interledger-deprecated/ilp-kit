"use strict"

const fs = require('fs')
const co = require('co')
const Koa = require('koa.io')
const bodyParser = require('koa-body')
const logger = require('koa-mag')
const session = require('koa-session')
const cors = require('kcors')
const errorHandler = require('five-bells-shared/middlewares/error-handler')
const Validator = require('five-bells-shared').Validator
const Config = require('./config')
const Auth = require('./auth')
const Router = require('./router')
const DB = require('./db')
const Log = require('./log')
const Ledger = require('./ledger')
const SPSP = require('./spsp')
const User = require('../models/user')
const Socket = require('./socket')
const Pay = require('./pay')
const Connector = require('./connector')

module.exports = class App {
  static constitute () { return [ Config, Auth, Router, Validator, Ledger, SPSP, DB, Log, Socket, User, Pay, Connector ] }
  constructor (config, auth, router, validator, ledger, spsp, db, log, socket, user, pay, connector) {
    this.config = config
    this.auth = auth
    this.router = router
    this.socket = socket
    this.validator = validator
    this.ledger = ledger
    this.spsp = spsp
    this.user = user
    this.db = db
    this.pay = pay
    this.log = log('app')
    this.connector = connector

    validator.loadSchemasFromDirectory(__dirname + '/../../schemas')

    const app = this.app = new Koa()

    const uploadDir = __dirname + '/../../../uploads'

    // Create uploads folder
    try {
      fs.mkdirSync(uploadDir)
    } catch (err) {
      // ignore if the folder already exists
      if (err.code !== 'EEXIST') { throw err }
    }

    app.use(bodyParser({
      multipart: true,
      formidable: {
        keepExtensions: true,
        uploadDir
      }
    }))

    app.use(function *(next) {
      if (this.request.method === 'POST' || this.request.method === 'PUT') {
        // the parsed body will store in this.request.body
        // if nothing was parsed, body will be an empty object {}
        this.body = this.request.body
      }
      yield next
    })

    app.use(logger({mag: log('http')}))
    app.use(errorHandler({log: log('error-handler')}))
    app.use(cors({origin: '*'}))

    app.proxy = true

    app.keys = [this.config.data.get('sessionSecret')]
    app.use(session({
      maxAge: 2592000000
    }, app))

    app.use(require('koa-static')(__dirname + '/../../../uploads'))

    socket.attach(app)
    auth.attach(app)

    router.setupDefaultRoutes()
    router.attach(app)
  }

  start() {
    co(this._start.bind(this)).catch(err => {
      this.log.critical(err)
    })
  }

  * _start() {
    if (this.db.options.dialect === 'sqlite') {
      yield this.db.sync()
    } else {
      yield this.db.migrate()
    }

    // Ensure admin and connector accounts exists
    const adminAccount = yield this.user.setupAdminAccount()
    const connectorAccount = yield this.user.setupConnectorAccount()

    this.listen()

    yield this.connector.start()

    // Initial connector funding
    if (connectorAccount && connectorAccount.new) {
      yield this.pay.pay({
        source: adminAccount,
        destination: connectorAccount.username,
        sourceAmount: 1000,
        destinationAmount: 1000,
        message: 'Initial connector funding'
      })
    }
  }

  listen() {
    this.app.listen(this.config.data.getIn(['server', 'port']))
    this.log.info('wallet listening on ' + this.config.data.getIn(['server', 'bind_ip']) +
      ':' + this.config.data.getIn(['server', 'port']))
    this.log.info('public at ' + this.config.data.getIn(['server', 'base_uri']))
  }
}
