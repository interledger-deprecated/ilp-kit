"use strict"

const co = require('co')
const _ = require('lodash')

const Config = require('./config')
const Log = require('./log')
const PaymentFactory = require('../models/payment')
const Ledger = require('./ledger')

module.exports = class Socket {
  static constitute () { return [Config, Log, PaymentFactory, Ledger] }
  constructor (config, log, Payment, ledger) {
    this.log = log('socket')
    this.ledger = ledger
    this.Payment = Payment
    this.subscribers = {}
  }

  attach (app) {
    let self = this

    // TODO ensure the username is the currently logged in user
    app.io.route('subscribe', function (next, username) {
      self.addSubscriber(username, this.socket)
    })

    app.io.route('unsubscribe', function (next, username) {
      // TODO implement
    })

    app.io.use(function* (next) {
      // on conncet
      yield* next
      // on disconnect
    })
  }

  addSubscriber(username, socket) {
    let self = this

    self.log.info('Subscribe ' + username)

    // Add the subscriber
    let subscriber = self.subscribers[username] = self.subscribers[username] || { clients: {} }
    subscriber.clients[socket.id] = socket

    // should socket be aware of the ledger? may need to move this somwehere else
    self.ledger.on('transfer_' + username, function(transfer){
      self.transfer(username, transfer)
    })
  }

  transfer(username, transfer) {
    let self = this

    // TODO move this logic somewhere else?
    self.Payment.findOne({where: {transfers: transfer.id}})
      .then(function (data) {
        self.log.info('payment for ' + username)

        _.map(self.subscribers[username].clients, function(client){
          client.emit('payment', data)
        })
      })

    // Fire a balance update event
    // TODO move somewhere else
    co(function *() {
      var account = yield self.ledger.getAccount({username: username}, true)
      self.updateBalance(username, account.balance)
    }).catch((err) => {
      // TODO handle
    })
  }

  updateBalance(username, balance) {
    let self = this

    self.log.info('balance update for ' + username)

    _.map(self.subscribers[username].clients, function(client){
      client.emit('balance', balance)
    })
  }
}
