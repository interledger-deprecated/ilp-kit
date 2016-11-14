"use strict"

module.exports = InviteFactory

const _ = require('lodash')
const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Config = require('../lib/config')
const Sequelize = require('sequelize')
const UserFactory = require('./user')

InviteFactory.constitute = [Database, Validator, Container]
function InviteFactory(sequelize, validator, container) {
  class Invite extends Model {
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
      return data
    }

    static convertToPersistent(data) {
      return data
    }
  }

  Invite.validateExternal = validator.create('Invite')

  PersistentModelMixin(Invite, sequelize, {
    code: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    amount: {
      type: Sequelize.INTEGER
    },
    claimed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  })

  container.schedulePostConstructor((User) => {
    Invite.DbModel.belongsTo(User.DbModel)
  }, [ UserFactory ])

  return Invite
}
