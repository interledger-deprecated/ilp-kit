"use strict"

module.exports = PaymentFactory

const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const InvalidBodyError = require('five-bells-shared/errors/invalid-body-error')
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Config = require('../lib/config')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

PaymentFactory.constitute = [Database, Validator, Container, Config]
function PaymentFactory (sequelize, validator, container, config) {
  class Payment extends Model {
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

    static createBodyParser () {
      const Self = this

      return function * (next) {
        let json = this.body
        const validationResult = Self.validateExternal(json)
        if (validationResult.valid !== true) {
          const message = validationResult.schema
            ? 'Body did not match schema ' + validationResult.schema
            : 'Body did not pass validation'
          throw new InvalidBodyError(message, validationResult.errors)
        }

        const model = new Self()
        model.setDataExternal(json)
        this.body = model

        yield next
      }
    }
  }

  Payment.validateExternal = validator.create('Payment')

  PersistentModelMixin(Payment, sequelize, {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    source_user: Sequelize.INTEGER,
    destination_user: Sequelize.INTEGER,
    destination_account: Sequelize.STRING(1024),
    transfers: Sequelize.ARRAY(Sequelize.STRING(1024)),
    state: Sequelize.ENUM('pending', 'success', 'fail'),
    source_amount: Sequelize.STRING(1024), // TODO put the right type
    destination_amount: Sequelize.STRING(1024), // TODO put the right type
    created_at: Sequelize.DATE,
    completed_at: Sequelize.DATE
  })

  // We use a post constructor in order to avoid issues with circular
  // dependencies.
  /*container.schedulePostConstructor((Notary, CaseNotary) => {
    Case.DbModel.belongsToMany(Notary.DbModel, {
      through: {
        model: CaseNotary.DbModel,
        unique: false
      },
      foreignKey: 'case_id',
      constraints: false
    })
  }, [ NotaryFactory, CaseNotaryFactory ])*/

  return Payment
}