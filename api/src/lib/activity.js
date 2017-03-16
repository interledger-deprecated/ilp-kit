'use strict'

const _ = require('lodash')
const moment = require('moment')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Socket = require('../lib/socket')
const ActivityLogFactory = require('../models/activity_log')

const cacheLifetime = 30 * 60 // seconds

module.exports = class Activity {
  static constitute () { return [ Log, Config, ActivityLogFactory, Socket ] }
  constructor (log, config, ActivityLog, socket) {
    this.log = log('activity')
    this.config = config
    this.socket = socket
    this.ActivityLog = ActivityLog

    // TODO:PERFORMANCE use Redis
    this.paymentGroupCache = {}

    setInterval(this.paymentGroupCacheCleanup.bind(this), 60000) // runs every minute
  }

  * processPayment (payment, user) {
    this.log.info(`Processing payment ${payment.id} for ${user.username}`)

    // This payment doesn't affect the given user
    if (payment.source_user !== user.id && payment.destination_user !== user.id) return

    const cacheId = payment.source_identifier +
      payment.destination_identifier +
      payment.message +
      user.id
    const cache = this.paymentGroupCache[cacheId]

    let activityLog

    if (!cache) {
      activityLog = new this.ActivityLog()
      activityLog.user_id = user.id
      activityLog = yield activityLog.save()
    } else {
      // Cache exists, which means there was a payment between source and destination
      // with the same message, and the same side of activity within the past 30 mins
      activityLog = cache.activityLog
    }

    // Add the activity to the payment
    yield activityLog.addPayment(payment)

    // Add the payment to the recent payments cache (used for grouping)
    this.paymentGroupCache[cacheId] = {
      recentDate: payment.created_at,
      // TODO:PERFORMANCE might be better to keep the activityLog.id instead of the whole object
      activityLog
    }

    // TODO:PERFORMANCE figure out a way to send a socket message for a single payment
    // instead of the whole activity (if the client already has a track of this activity)
    activityLog = yield this.ActivityLog.getActivityLog(activityLog.id)

    // Notify the clients
    this.socket.activity(user.username, activityLog)
  }

  paymentGroupCacheCleanup () {
    this.paymentGroupCache = _.pickBy(this.paymentGroupCache,
      group => moment(group.recentDate).add(cacheLifetime, 'seconds') > moment())
  }
}
