const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Config = require('../lib/config')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

PaymentFactory.constitute = [Database, Validator, Container, Config]
export default function PaymentFactory (sequelize, validator, container, config) {
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