import { Container } from 'constitute'
import makeRouter from 'koa-router'

import AuthController from '../controllers/auth'
import UsersController from '../controllers/users'
import PaymentsController from '../controllers/payments'

export default class Router {
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