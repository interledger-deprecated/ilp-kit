'use strict'

const _ = require('lodash')

const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const validator = require('../services/validator')
const uri = require('../services/uriManager')

const Sequelize = require('sequelize')
const sequelize = require('../services/db')

class Payment extends Model {
  static convertFromExternal (data) {
    // ID is optional on the incoming side
    if (data.id) {
      data.id = uri.parse(data.id, 'payment').id.toLowerCase()
    }

    return data
  }

  static convertToExternal (data) {
    data.id = uri.make('payment', data.id.toLowerCase())

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

Payment.validateExternal = validator.create('Payment')

PersistentModelMixin(Payment, sequelize, {
  id: {
    type: Sequelize.UUID,
    primaryKey: true
  },
  source_user: Sequelize.INTEGER,
  destination_user: Sequelize.INTEGER,
  destination_account: Sequelize.STRING(1024),
  transfers: Sequelize.ARRAY(Sequelize.UUID),
  state: Sequelize.ENUM('pending', 'success', 'fail'),
  source_amount: Sequelize.STRING(1024), // TODO put the right type
  destination_amount: Sequelize.STRING(1024), // TODO put the right type
  created_at: Sequelize.DATE,
  completed_at: Sequelize.DATE
})

exports.Payment = Payment
