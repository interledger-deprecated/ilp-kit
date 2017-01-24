"use strict"

module.exports = PeerFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

PeerFactory.constitute = [Database, Validator]
function PeerFactory(sequelize, validator) {
  class Peer extends Model {
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

  Peer.validateExternal = validator.create('Peer')

  PersistentModelMixin(Peer, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    hostname: Sequelize.STRING,
    limit: Sequelize.FLOAT,
    currency: Sequelize.STRING,
    destination: Sequelize.STRING
  })

  return Peer
}
