'use strict'

const _ = require('lodash')
const Ledger = require('../lib/ledger')
const Auth = require('../lib/auth')
const Config = require('../lib/config')
const PaymentFactory = require('../models/payment')
const UserFactory = require('../models/user')

module.exports = NotificationsControllerFactory

NotificationsControllerFactory.constitute = [Ledger, Auth, PaymentFactory, UserFactory, Config]
function NotificationsControllerFactory (ledger, Auth, Payment, User, Config) {
  return class NotificationsController {
    static init (router) {
      router.post('/notifications', this.postResource)
    }

    static * postResource () {
      const notification = this.body
      const transfer = notification.resource

      // Only handle executed payments for now
      if (transfer.state !== 'executed') {
        this.body = {'status': 'OK'}
        return
      }

      let paymentObj = {
        transfers: transfer.id,
        source_account: (transfer.additional_info && transfer.additional_info.source_account) || transfer.debits[0].account,
        destination_account: (transfer.additional_info && transfer.additional_info.destination_account) || transfer.credits[0].account,
        source_amount: (transfer.additional_info && transfer.additional_info.source_amount) || transfer.debits[0].amount,
        destination_amount: (transfer.additional_info && transfer.additional_info.destination_amount) || transfer.credits[0].amount
      };

      // TODO move this logic somewhere else
      // Source user
      if (_.startsWith(transfer.debits[0].account, Config.data.getIn(['ledger', 'public_uri']) + '/accounts/')) {
        let user = yield User.findOne({where: {username: transfer.debits[0].account.slice(Config.data.getIn(['ledger', 'public_uri']).length + 10)}})
        if (user) {
          paymentObj.source_user = user.id
        }
      }

      // Destination user
      if (_.startsWith(transfer.credits[0].account, Config.data.getIn(['ledger', 'public_uri']) + '/accounts/')) {
        let user = yield User.findOne({where: {username: transfer.credits[0].account.slice(Config.data.getIn(['ledger', 'public_uri']).length + 10)}})
        if (user) {
          paymentObj.destination_user = user.id
        }
      }

      // Create the payment object
      let payment = new Payment()
      payment.setDataExternal(paymentObj)

      try {
        yield payment.create()
      } catch(e) {
        // TODO handle
      }

      ledger.emitTransferEvent(transfer)

      this.body = {'status': 'OK'}
    }
  }
}
