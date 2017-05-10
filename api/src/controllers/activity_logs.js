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

    static async getAll (ctx) {
      const page = ctx.query.page || 1
      const limit = ctx.query.limit || 10

      const activityLog = await ActivityLog.getUserActivityLog(ctx.state.user.id, page, limit)

      ctx.body = {
        list: activityLog.rows,
        totalPages: Math.ceil(activityLog.count / limit)
      }
    }
  }
}
