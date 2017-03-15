'use strict'

const _ = require('lodash')
const moment = require('moment')
const Log = require('../lib/log')
const Config = require('../lib/config')
const ActivityLogFactory = require('../models/activity_log')

const cacheLifetime = 30 * 60 // seconds

module.exports = class Activity {
  static constitute () { return [ Log, Config, ActivityLogFactory ] }
  constructor (log, config, ActivityLog) {
    this.log = log('activity')
    this.config = config
    this.ActivityLog = ActivityLog

    // TODO:PERFORMANCE use Redis
    this.paymentGroupCache = {}

    setInterval(this.paymentGroupCacheCleanup.bind(this), 60000) // runs every minute
  }

  * processPayment (payment, side) {
    const cacheId = payment.source_identifier +
      payment.destination_identifier +
      payment.message +
      side
    const cache = this.paymentGroupCache[cacheId]

    let activityLog

    if (!cache) {
      activityLog = new this.ActivityLog()
      activityLog.user_id = payment[side === 'source' ? 'source_user' : 'destination_user']
      activityLog = yield activityLog.save()
    } else {
      // Cache exists, which means there was a payment between source and destination
      // with the same message, and the same side of activity within the past 30 mins
      activityLog = cache.activityLog
    }

    // Add the activity to the payment
    yield payment.addActivityLog(activityLog)

    // Add the payment to the recent payments cache (used for grouping)
    this.paymentGroupCache[cacheId] = {
      recentDate: payment.created_at,
      // TODO:PERFORMANCE might be better to keep the activityLog.id instead of the whole object
      activityLog: activityLog
    }

    this.log.info('Adding activity for payment', payment.id)
  }

  paymentGroupCacheCleanup () {
    this.paymentGroupCache = _.pickBy(this.paymentGroupCache,
      group => moment(group.recentDate).add(cacheLifetime, 'seconds') > moment())

    this.log.info(`Cleaning up the payment cache. ${this.paymentGroupCache.length} items left.`)
  }
}
