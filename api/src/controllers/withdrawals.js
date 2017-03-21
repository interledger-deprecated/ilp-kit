'use strict'

module.exports = WithdrawalsControllerFactory

const _ = require('lodash')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Utils = require('../lib/utils')
const Ledger = require('../lib/ledger')
const Activity = require('../lib/activity')
const UserFactory = require('../models/user')
const WithdrawalFactory = require('../models/withdrawal')

WithdrawalsControllerFactory.constitute = [Auth, Activity, Log, Utils, Ledger, UserFactory, WithdrawalFactory]
function WithdrawalsControllerFactory (Auth, activity, log, utils, ledger, User, Withdrawal) {
  log = log('activity_logs')

  return class ActivityLogsController {
    static init (router) {
      router.post('/withdrawals/:id', Auth.checkAuth, this.postResource)
    }

    static * postResource () {
      const user = this.req.user
      const amount = this.body.amount

      let transferId

      try {
        // TODO:BEFORE_DEPLOY make the ledger payment
      } catch (e) {
        console.log('withdrawals:29', e)

        // TODO:BEFORE_DEPLOY handle
        throw e
      }

      let withdrawal = new Withdrawal()
      withdrawal.amount = amount
      withdrawal.status = 'pending'
      withdrawal.transfer_id = transferId
      withdrawal.user_id = user.id
      withdrawal = yield withdrawal.save()

      yield activity.processWithdrawal(withdrawal)
    }
  }
}
