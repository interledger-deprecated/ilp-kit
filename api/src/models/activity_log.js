'use strict'

module.exports = ActivityLogFactory

const _ = require('lodash')
const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const PaymentFactory = require('./payment')
const SettlementFactory = require('./settlement')
const ActivityLogsItemFactory = require('./activity_logs_item')

ActivityLogFactory.constitute = [Database, Validator, Container]
function ActivityLogFactory (sequelize, validator, container) {
  let Payment
  let Settlement

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

    static * getUserActivityLog (userId, page, limit) {
      page = page > 0 ? Number(page) : 1
      limit = Number(limit)

      // TODO:BEFORE_DEPLOY don't include all of the fields
      return ActivityLog.DbModel.findAndCountAll({
        where: { user_id: userId },
        include: [
          { model: Payment.DbModel },
          { model: Settlement.DbModel }
        ],
        order: ['created_at'],
        limit,
        offset: limit * (page - 1)
      })
    }
  }

  ActivityLog.validateExternal = validator.create('ActivityLog')

  PersistentModelMixin(ActivityLog, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    }
    // TODO:BEFORE_DEPLOY update migration
  })

  container.schedulePostConstructor(ActivityLogsItem => {
    container.schedulePostConstructor(model => {
      Payment = model

      // Payment
      ActivityLog.DbModel.belongsToMany(Payment.DbModel, {
        through: {
          model: ActivityLogsItem.DbModel,
          unique: false
        },
        foreignKey: 'activity_log_id',
        constraints: false
      })
    }, [ PaymentFactory ])

    // Settlement
    container.schedulePostConstructor(model => {
      Settlement = model

      ActivityLog.DbModel.belongsToMany(Settlement.DbModel, {
        through: {
          model: ActivityLogsItem.DbModel,
          unique: false
        },
        foreignKey: 'activity_log_id',
        constraints: false
      })
    }, [ SettlementFactory ])
  }, [ ActivityLogsItemFactory ])

  return ActivityLog
}
