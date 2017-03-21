'use strict'

module.exports = WithdrawalFactory

const _ = require('lodash')
const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const UserFactory = require('./user')
const ActivityLogFactory = require('./activity_log')
const ActivityLogsItemFactory = require('./activity_logs_item')

WithdrawalFactory.constitute = [Database, Validator, Container]
function WithdrawalFactory (sequelize, validator, container) {
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

  container.schedulePostConstructor(User => {
    Withdrawal.DbModel.belongsTo(User.DbModel)
  }, [ UserFactory ])

  container.schedulePostConstructor(ActivityLog => {
    container.schedulePostConstructor(ActivityLogsItem => {
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
    }, [ ActivityLogsItemFactory ])
  }, [ ActivityLogFactory ])

  return Withdrawal
}
