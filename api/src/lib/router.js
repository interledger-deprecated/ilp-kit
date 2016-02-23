"use strict"

const Container = require('constitute').Container
const makeRouter = require('koa-router')

const HealthController = require('../controllers/health')
const AuthController = require('../controllers/auth')
const UsersController = require('../controllers/users')
const PaymentsController = require('../controllers/payments')
const NotificationsController = require('../controllers/notifications')

module.exports = class Router {
  static constitute () { return [ Container ] }
  constructor (container) {
    this.container = container
    this.router = makeRouter()
  }

  setupDefaultRoutes () {
    const health = this.container.constitute(HealthController)
    health.init(this.router)

    const auth = this.container.constitute(AuthController)
    auth.init(this.router)

    const users = this.container.constitute(UsersController)
    users.init(this.router)

    const payments = this.container.constitute(PaymentsController)
    payments.init(this.router)

    const notifications = this.container.constitute(NotificationsController)
    notifications.init(this.router)
  }

  attach (app) {
    app.use(this.router.middleware())
    app.use(this.router.routes())
  }
}
