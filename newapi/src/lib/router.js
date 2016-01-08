"use strict"

const Container = require('constitute').Container
const makeRouter = require('koa-router')

const AuthController = require('../controllers/auth')
const UsersController = require('../controllers/users')
const PaymentsController = require('../controllers/payments')

module.exports = class Router {
  static constitute () { return [ Container ] }
  constructor (container) {
    this.container = container
    this.router = makeRouter()
  }

  setupDefaultRoutes () {
    const auth = this.container.constitute(AuthController)
    auth.init(this.router)

    const users = this.container.constitute(UsersController)
    users.init(this.router)

    const payments = this.container.constitute(PaymentsController)
    payments.init(this.router)
  }

  attach (app) {
    app.use(this.router.middleware())
    app.use(this.router.routes())
  }
}