'use strict'

module.exports = ActivityLogFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const UserFactory = require('./user')
const PaymentFactory = require('./payment')
const WithdrawalFactory = require('./withdrawal')
const SettlementFactory = require('./settlement')
const ActivityLogsItemFactory = require('./activity_logs_item')

function ActivityLogFactory (deps) {
  const sequelize = deps(Database)
  const validator = deps(Validator)

  let Payment
  let Settlement
  let Withdrawal

  class ActivityLog extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      delete data.created_at
      delete data.updated_at

      return data
    }

    static convertFromPersistent (data) {
      data = _.omit(data, _.isNull)
      return data
    }

    static convertToPersistent (data) {
      return data
    }

    static async getUserActivityLog (userId, page, limit) {
      page = page > 0 ? Number(page) : 1
      limit = Number(limit)

      // TODO:BEFORE_DEPLOY don't include all of the fields
      return ActivityLog.DbModel.findAndCountAll({
        distinct: true,
        where: { user_id: userId },
        include: [
          { model: Payment.DbModel },
          { model: Settlement.DbModel },
          { model: Withdrawal.DbModel }
        ],
        order: [
          [ 'updated_at', 'DESC' ],
          [ Payment.DbModel, 'created_at', 'DESC' ],
          [ Settlement.DbModel, 'created_at', 'DESC' ],
          [ Withdrawal.DbModel, 'created_at', 'DESC' ]
        ],
        limit,
        offset: limit * (page - 1)
      })
    }

    static async getActivityLog (id) {
      // TODO:BEFORE_DEPLOY don't include all of the fields
      return ActivityLog.findOne({
        where: { id },
        include: [
          { model: Payment.DbModel },
          { model: Settlement.DbModel },
          { model: Withdrawal.DbModel }
        ],
        order: [
          [ Payment.DbModel, 'created_at', 'DESC' ],
          [ Settlement.DbModel, 'created_at', 'DESC' ],
          [ Withdrawal.DbModel, 'created_at', 'DESC' ]
        ],
      })
    }
  }

  ActivityLog.validateExternal = validator.create('ActivityLog')

  PersistentModelMixin(ActivityLog, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    stream_id: Sequelize.STRING
  })

  deps.later(() => {
    const User = deps(UserFactory)
    const ActivityLogsItem = deps(ActivityLogsItemFactory)
    Payment = deps(PaymentFactory)
    Settlement = deps(SettlementFactory)
    Withdrawal = deps(WithdrawalFactory)

    ActivityLog.DbModel.belongsTo(User.DbModel)

    // Payment
    ActivityLog.DbModel.belongsToMany(Payment.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'payment'
        }
      },
      foreignKey: 'activity_log_id',
      constraints: false
    })

    // Settlement
    ActivityLog.DbModel.belongsToMany(Settlement.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'settlement'
        }
      },
      foreignKey: 'activity_log_id',
      constraints: false
    })

    // Withdrawal
    ActivityLog.DbModel.belongsToMany(Withdrawal.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'withdrawal'
        }
      },
      foreignKey: 'activity_log_id',
      constraints: false
    })
  })

  return ActivityLog
}
