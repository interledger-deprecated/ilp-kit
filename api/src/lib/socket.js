'use strict'

const _ = require('lodash')
const IO = require('koa-socket-2')

const Log = require('./log')
const PaymentFactory = require('../models/payment')
const Ledger = require('./ledger')

module.exports = class Socket {
  constructor (deps) {
    this.log = deps(Log)('socket')
    this.ledger = deps(Ledger)
    this.Payment = deps(PaymentFactory)

    this.io = new IO()

    /**
     * Format
     *
     * {
     *   username: {
     *     socketId: socket
     *     socketId: socket
     *     ...
     *   }
     *   {username}: {
     *     socketId: socket
     *     socketId: socket
     *     ...
     *   }
     *   ...
     * }
     */
    this.users = {}
  }

  // Add a subscribed user
  addUser (username) {
    const self = this

    // TODO should socket be aware of the ledger? may need to move this somewhere else
    self.ledger.on('transfer_' + username, (transfer) => {
      self.transfer(username, transfer)
    })

    self.users[username] = self.users[username] || { subscriptions: {} }
    return self.users[username]
  }

  // Remove the user if it doesn't have subscriptions
  cleanup (username) {
    const self = this

    if (self.users[username] && _.isEmpty(self.users[username].subscriptions)) {
      delete this.users[username]

      self.ledger.removeAllListeners('transfer_' + username)
    }
  }

  // Add a subscription under the user
  addSubscription (username, socket) {
    const self = this

    self.log.info('Subscribe ' + username)

    // Add the subscription
    const user = self.users[username] || self.addUser(username)

    user.subscriptions[socket.id] = socket
  }

  // Remove the subscription
  removeSubscription (id) {
    const self = this

    _.map(self.users, (s, key) => {
      if (s.subscriptions[id]) {
        delete s.subscriptions[id]
        self.cleanup(key)
      }
    })
  }

  emitToUser (username, event, data) {
    if (!this.users[username]) return

    _.map(this.users[username].subscriptions, (subscription) => {
      subscription.emit(event, data)
    })
  }

  attach (app) {
    const self = this

    this.io.attach(app)
    // this.io.use(async (ctx, next) => {
      // console.log('io middleware')
      // self.log.info('Connected ' + ctx.socket.id)
      // await next()
      // self.log.info('Disconnected ' + ctx.socket.id)
      // self.removeSubscription(ctx.socket.id)
    // })
    this.io.on('connection', sock => {
      console.log('raw connection socket.io')
    })
    this.io.on('connection', function (ctx) {
      console.log('socket io connection')
    })
    // TODO ensure the username is the currently logged in user
    this.io.on('subscribe', function (ctx, username) {
      self.addSubscription(username, ctx.socket)
    })
  }

  activity (username, activityLog) {
    const self = this

    self.emitToUser(username, 'activity', activityLog)

    ;(async function () {
      const account = await self.ledger.getAccount({ username }, true)
      self.updateBalance(username, account.balance)
    })().catch(err => {
      console.log('socket:152', err)
    })

    this.log.info(`activity for ${username}`)
  }

  updateBalance (username, balance) {
    const self = this

    self.log.info('balance update for ' + username)

    // TODO signup click reload, gets you an exception
    self.emitToUser(username, 'balance', balance)
  }
}
