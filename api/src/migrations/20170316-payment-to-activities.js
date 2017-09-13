const moment = require('moment')
const uuid = require('uuid4')

module.exports = {
  up: sequelize => {
    // used for grouping payments
    let prevPayment
    let prevActivityLogIds = {}

    const createActivityLog = (activityLogId, payment, side) => {
      return sequelize.query(`INSERT INTO "ActivityLogs" VALUES ('${activityLogId}', ${payment[side + '_user']}, '${moment(payment.created_at).utc()}', '${moment(payment.updated_at).utc()}')`, { type: sequelize.QueryTypes.INSERT })
    }

    const createActivityLogItem = (activityLogId, payment) => {
      return sequelize.query(`INSERT INTO "ActivityLogsItems" VALUES (DEFAULT, '${activityLogId}', 'payment', '${payment.id}', '${moment(payment.created_at).utc()}', '${moment(payment.updated_at).utc()}')`, { type: sequelize.QueryTypes.INSERT })
    }

    const processPayment = (payment, side) => {
      const activityLogId = uuid()

      if (prevPayment &&
        payment.source_identifier === prevPayment.source_identifier &&
        payment.destination_identifier === prevPayment.destination_identifier &&
        payment.message === prevPayment.message &&
        moment(prevPayment.created_at).add(30, 'minutes') > moment(payment.created_at)) {
        // Put the payment into an activity
        createActivityLogItem(prevActivityLogIds[side], payment)
      } else {
        // create a new activity
        createActivityLog(activityLogId, payment, side)
          .then(() => createActivityLogItem(activityLogId, payment))

        prevActivityLogIds[side] = activityLogId
      }
    }

    // get the payments
    sequelize.query('SELECT * FROM "Payments"', { type: sequelize.QueryTypes.SELECT })
      .then(payments => {
        payments.forEach(payment => {
          if (payment.source_user) {
            processPayment(payment, 'source')
          }
          if (payment.destination_user) {
            processPayment(payment, 'destination')
          }

          prevPayment = payment
        })
      })
  },
  down: sequelize => {
    return sequelize.query('DELETE FROM "ActivityLogsItems"')
      .then(() => sequelize.query('DELETE FROM "ActivityLogs"'))
  }
}
