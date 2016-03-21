"use strict"

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
    this.listeners = {}
  }

  attach (app) {
    let self = this

    // TODO ensure the username is the currently logged in user
    app.io.route('subscribe', function (next, username) {
      let socket = this.socket

      self.log.info('WS:' + socket.id + ' Subscribe ' + username)

      self.listeners[socket.id] = (transfer) => {
        // TODO move this logic somewhere else
        self.Payment.findOne({where: {transfers: transfer.id}})
          .then(function(data){
            socket.emit('payment', data)
          })
      }

      // TODO move this outside. Socket shouldn't know anything about the ledger
      self.ledger.on('transfer_' + username, self.listeners[socket.id])
    });

    app.io.route('unsubscribe', function (next, username) {
      self.log.info('WS:' + this.socket.id + ' Unsubscribe ' + username)
      self.ledger.removeListener('transfer_' + username, listeners[this.socket.id])
    });

    app.io.use(function* (next) {
      // on conncet
      yield* next;
      // on disconnect
    });
  }
}
