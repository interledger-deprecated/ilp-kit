'use strict'

const _ = require('lodash')
const requestUtil = require('five-bells-shared/utils/request')
const Ledger = require('../lib/ledger')

module.exports = NotificationsControllerFactory

NotificationsControllerFactory.constitute = [Ledger]
function NotificationsControllerFactory (ledger) {
  return class NotificationsController {
    static init (router) {
      router.post('/notifications', this.postResource)
    }

    static * postResource () {
      const notification = this.body
      const transfer = notification.resource
      ledger.emitTransferEvent(transfer)

      this.body = {'status': 'OK'}
    }
  }
}
