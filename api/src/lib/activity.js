'use strict'

const debug = require('debug')('ilp-kit:activity')
const Log = require('../lib/log')
const Config = require('../lib/config')
const ActivityLogFactory = require('../models/activity_log')

module.exports = class Activity {
  static constitute () { return [ Log, Config, ActivityLogFactory ] }
  constructor (log, config, ActivityLog) {
    this.log = log('activity')
    this.config = config
    this.ActivityLog = ActivityLog
  }

  * processPayment (payment, side) {
    let activityLog = new this.ActivityLog()
    activityLog.user_id = payment[side === 'source' ? 'source_user' : 'destination_user']
    activityLog = yield activityLog.save()

    // Add the activity to the payment
    yield payment.addActivityLog(activityLog)

    debug('Adding activity for payment', payment.id)
  }
}
