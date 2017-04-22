'use strict'

module.exports = ActivityLogsItemFactory

const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

function ActivityLogsItemFactory (deps) {
  const sequelize = deps(Database)
  const validator = deps(Validator)

  class ActivityLogsItem extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      return data
    }

    static convertFromPersistent (data) {
      return data
    }

    static convertToPersistent (data) {
      return data
    }
  }

  ActivityLogsItem.validateExternal = validator.create('ActivityLogsItem')

  PersistentModelMixin(ActivityLogsItem, sequelize, {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    activity_log_id: {
      type: Sequelize.UUID
    },
    item_type: {
      type: Sequelize.STRING
    },
    item_id: {
      type: Sequelize.UUID
    }
  })

  return ActivityLogsItem
}
