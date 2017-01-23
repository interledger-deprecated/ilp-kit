"use strict"

module.exports = SettlementMethodFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

SettlementMethodFactory.constitute = [Database, Validator]
function SettlementMethodFactory(sequelize, validator) {
  class SettlementMethod extends Model {
    static convertFromExternal(data) {
      return data
    }

    static convertToExternal(data) {
      delete data.password
      delete data.created_at
      delete data.updated_at

      return data
    }

    static convertFromPersistent(data) {
      data = _.omit(data, _.isNull)
      data.logoUrl = data.logo && '/api/' + data.logo

      return data
    }

    static convertToPersistent(data) {
      return data
    }
  }

  SettlementMethod.validateExternal = validator.create('SettlementMethod')

  // TODO:BEFORE_DEPLOY define columns
  PersistentModelMixin(SettlementMethod, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    type: Sequelize.STRING,
    name: Sequelize.STRING,
    logo: Sequelize.STRING,
    description: Sequelize.STRING,
    uri: Sequelize.STRING,
    enabled: Sequelize.BOOLEAN
  })

  return SettlementMethod
}
