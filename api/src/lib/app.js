"use strict"

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
const Socket = require('./socket')

module.exports = class App {
  static constitute () { return [ Config, Auth, Router, Validator, Ledger, SPSP, DB, Log, Socket ] }
  constructor (config, auth, router, validator, ledger, spsp, db, log, socket ) {
    this.config = config.data
    this.auth = auth
    this.router = router
    this.socket = socket
    this.validator = validator
    this.ledger = ledger
    this.spsp = spsp
    this.db = db
    this.log = log('app')

    validator.loadSchemasFromDirectory(__dirname + '/../../schemas')

    const app = this.app = new Koa()

    app.use(bodyParser())
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

    app.proxy = true;

    app.keys = [this.config.get('sessionSecret')]
    app.use(session(app))

    socket.attach(app)
    auth.attach(app)

    router.setupDefaultRoutes()
    router.attach(app)
  }

  start () {
    co(this._start.bind(this)).catch((err) => {
      this.log.critical(err)
    })
  }

  * _start () {
    yield this.db.sync()

    // Ensure ledger subscription exists
    yield this.ledger.subscribe()
    yield this.spsp.init()

    this.listen()
  }

  listen () {
    this.app.listen(this.config.getIn(['server', 'port']))
    this.log.info('wallet listening on ' + this.config.getIn(['server', 'bind_ip']) +
      ':' + this.config.getIn(['server', 'port']))
    this.log.info('public at ' + this.config.getIn(['server', 'base_uri']))
  }
}
