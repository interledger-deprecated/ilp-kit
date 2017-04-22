'use strict'

module.exports = WithdrawalFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const UserFactory = require('./user')
const ActivityLogFactory = require('./activity_log')
const ActivityLogsItemFactory = require('./activity_logs_item')

function WithdrawalFactory (deps) {
  const sequelize = deps(Database)
  const validator = deps(Validator)

  class Withdrawal extends Model {
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
  }

  Withdrawal.validateExternal = validator.create('Withdrawal')

  PersistentModelMixin(Withdrawal, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    amount: Sequelize.FLOAT,
    status: Sequelize.STRING,
    transfer_id: Sequelize.UUID
  })

  deps.later(() => {
    const User = deps(UserFactory)
    const ActivityLog = deps(ActivityLogFactory)
    const ActivityLogsItem = deps(ActivityLogsItemFactory)

    Withdrawal.DbModel.belongsTo(User.DbModel)
    Withdrawal.DbModel.belongsToMany(ActivityLog.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'withdrawal'
        }
      },
      foreignKey: 'item_id',
      constraints: false
    })
  })

  return Withdrawal
}
