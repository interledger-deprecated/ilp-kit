"use strict"

module.exports = SettlementFactory

const _ = require('lodash')
const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const PeerFactory = require('./peer')
const UserFactory = require('./user')
const SettlementMethodFactory = require('./settlement_method')

SettlementFactory.constitute = [Database, Validator, Container]
function SettlementFactory (sequelize, validator, container) {
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
    amount: Sequelize.FLOAT,
    currency: Sequelize.STRING
  })

  container.schedulePostConstructor(Peer => {
    Settlement.DbModel.belongsTo(Peer.DbModel)
  }, [ PeerFactory ])

  container.schedulePostConstructor(User => {
    Settlement.DbModel.belongsTo(User.DbModel)
  }, [ UserFactory ])

  container.schedulePostConstructor(SettlementMethod => {
    Settlement.DbModel.belongsTo(SettlementMethod.DbModel)
  }, [ SettlementMethodFactory ])

  return Settlement
}
