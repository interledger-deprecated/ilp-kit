'use strict'

module.exports = ActivityLogsControllerFactory

const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Utils = require('../lib/utils')
const UserFactory = require('../models/user')
const ActivityLogFactory = require('../models/activity_log')

ActivityLogsControllerFactory.constitute = [Auth, ActivityLogFactory, Log, Utils, UserFactory]
function ActivityLogsControllerFactory (Auth, ActivityLog, log, utils, User) {
  log = log('activity_logs')

  return class ActivityLogsController {
    static init (router) {
      router.get('/activity_logs', Auth.checkAuth, this.getAll)
    }

    static * getAll () {
      const page = this.query.page || 1
      const limit = this.query.limit || 10

      const activityLog = yield ActivityLog.getUserActivityLog(this.req.user.id, page, limit)

      this.body = {
        list: activityLog.rows,
        totalPages: Math.ceil(activityLog.count / limit)
      }
    }
  }
}
