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

      if (transfer.state === 'prepared') {
        // Sender doesn't need to do anything at this point
        if (transfer.credits[0].memo.receiver_payment_id) {
          ledger.preparedEvent(transfer)
          this.status = 200
        }
        return
      }

      if (transfer.state !== 'executed') {
        this.status = 200
        return
      }

      const debit = transfer.debits[0]
      const credit = transfer.credits[0]
      const additionalInfo = (credit.memo && credit.memo.ilp_header) ? credit.memo.ilp_header.data : credit.memo

      let paymentObj = {
        transfers: transfer.id,
        source_account: (additionalInfo && additionalInfo.source_account) || debit.account,
        destination_account: (additionalInfo && additionalInfo.destination_account) || credit.account,
        source_amount: (additionalInfo && additionalInfo.source_amount) || debit.amount,
        destination_amount: (additionalInfo && additionalInfo.destination_amount) || credit.amount,
        state: 'success'
      }

      // TODO move this logic somewhere else
      // Source user
      if (_.startsWith(debit.account, Config.data.getIn(['ledger', 'public_uri']) + '/accounts/')) {
        let user = yield User.findOne({where: {username: debit.account.slice(Config.data.getIn(['ledger', 'public_uri']).length + 10)}})
        if (user) {
          paymentObj.source_user = user.id
        }
      }

      // Destination user
      if (_.startsWith(credit.account, Config.data.getIn(['ledger', 'public_uri']) + '/accounts/')) {
        let user = yield User.findOne({where: {username: credit.account.slice(Config.data.getIn(['ledger', 'public_uri']).length + 10)}})
        if (user) {
          paymentObj.destination_user = user.id
        }
      }

      let payment

      const creditMemo = credit.memo

      // Receiver: Get the pending payment
      if (creditMemo && creditMemo.receiver_payment_id) {
        payment = yield Payment.findOne({where: {id: creditMemo.receiver_payment_id}})
      }

      // Sender: Get the pending payment
      if (!payment) {
        payment = yield Payment.findOne({where: {transfers: transfer.id}})
      }

      // Payment is not prepared
      if (!payment) {
        payment = new Payment()
      }

      payment.setDataExternal(paymentObj)

      try {
        yield payment.save()
      } catch(e) {
        // TODO handle
      }

      ledger.emitTransferEvent(transfer)

      this.status = 200
    }
  }
}
