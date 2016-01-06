const _ = require('lodash')

const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Config = require('../lib/config')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

UserFactory.constitute = [Database, Validator, Container, Config]
export default function UserFactory (sequelize, validator, container, config) {
  class User extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      delete data.password

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
    },
    password: Sequelize.STRING
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

  return User
}