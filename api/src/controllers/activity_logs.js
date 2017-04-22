'use strict'

module.exports = ActivityLogsControllerFactory

const Auth = require('../lib/auth')
const ActivityLogFactory = require('../models/activity_log')

function ActivityLogsControllerFactory (deps) {
  const auth = deps(Auth)
  const ActivityLog = deps(ActivityLogFactory)

  return class ActivityLogsController {
    static init (router) {
      router.get('/activity_logs', auth.checkAuth, this.getAll)
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
