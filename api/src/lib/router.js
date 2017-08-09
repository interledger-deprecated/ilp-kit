'use strict'

const makeRouter = require('koa-router')

const HealthController = require('../controllers/health')
const AuthController = require('../controllers/auth')
const UsersController = require('../controllers/users')
const PaymentsController = require('../controllers/payments')
const WebfingerController = require('../controllers/webfinger')
const MiscController = require('../controllers/misc')
const InviteController = require('../controllers/invites')
const PeerController = require('../controllers/peers')
const SettlementsController = require('../controllers/settlements')
const SettlementMethodsController = require('../controllers/settlement_methods')
const WithdrawalsController = require('../controllers/withdrawals')
const ActivityLogsController = require('../controllers/activity_logs')

module.exports = class Router {
  constructor (deps) {
    this.deps = deps
    this.router = makeRouter()
  }

  setupDefaultRoutes () {
    const health = this.deps(HealthController)
    health.init(this.router)

    const auth = this.deps(AuthController)
    auth.init(this.router)

    const users = this.deps(UsersController)
    users.init(this.router)

    const payments = this.deps(PaymentsController)
    payments.init(this.router)

    const webfinger = this.deps(WebfingerController)
    webfinger.init(this.router)

    const misc = this.deps(MiscController)
    misc.init(this.router)

    const invites = this.deps(InviteController)
    invites.init(this.router)

    const peers = this.deps(PeerController)
    peers.init(this.router)

    const settlementMethods = this.deps(SettlementMethodsController)
    settlementMethods.init(this.router)

    const settlements = this.deps(SettlementsController)
    settlements.init(this.router)

    const withdrawals = this.deps(WithdrawalsController)
    withdrawals.init(this.router)

    const activityLogs = this.deps(ActivityLogsController)
    activityLogs.init(this.router)
  }

  attach (app) {
    app.use(this.router.middleware())
    app.use(this.router.routes())
  }
}
