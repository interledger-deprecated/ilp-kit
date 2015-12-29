'use strict'

const _ = require('lodash')

const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const validator = require('../services/validator')

const Sequelize = require('sequelize')
const sequelize = require('../services/db')

class User extends Model {
  static convertFromExternal (data) {
    return data
  }

  static convertToExternal (data) {
    return data
  }

  static convertFromPersistent (data) {
    delete data.created_at
    delete data.updated_at
    data = _.omit(data, _.isNull)
    return data
  }

  static convertToPersistent (data) {
    return data
  }
}

// TODO add schemas for all models
User.validateExternal = validator.create('User')

PersistentModelMixin(User, sequelize, {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    unique: true
  }
})

exports.User = User
