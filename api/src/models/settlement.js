'use strict'

module.exports = SettlementFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const PeerFactory = require('./peer')
const UserFactory = require('./user')
const SettlementMethodFactory = require('./settlement_method')
const ActivityLogFactory = require('./activity_log')
const ActivityLogsItemFactory = require('./activity_logs_item')

function SettlementFactory (deps) {
  const sequelize = deps(Database)
  const validator = deps(Validator)

  class Settlement extends Model {
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

  Settlement.validateExternal = validator.create('Settlement')

  PersistentModelMixin(Settlement, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    amount: Sequelize.INTEGER,
    currency: Sequelize.STRING
  })

  deps.later(() => {
    const Peer = deps(PeerFactory)
    const User = deps(UserFactory)
    const SettlementMethod = deps(SettlementMethodFactory)
    const ActivityLog = deps(ActivityLogFactory)
    const ActivityLogsItem = deps(ActivityLogsItemFactory)

    Settlement.DbModel.belongsTo(Peer.DbModel)
    Settlement.DbModel.belongsTo(User.DbModel)
    Settlement.DbModel.belongsTo(SettlementMethod.DbModel)
    Settlement.DbModel.belongsToMany(ActivityLog.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'settlement'
        }
      },
      foreignKey: 'item_id',
      constraints: false
    })
  })

  return Settlement
}
