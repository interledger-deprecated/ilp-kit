"use strict"

module.exports = UserFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Ledger = require('../lib/ledger')
const Sequelize = require('sequelize')

const ServerError = require('../errors/server-error')
const InvalidBodyError = require('../errors/invalid-body-error')
const EmailTakenError = require('../errors/email-taken-error')

UserFactory.constitute = [Database, Validator, Ledger]
function UserFactory (sequelize, validator, ledger) {
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

    * changeEmail (email) {
      this.email = email

      const validationResult = User.validateExternal({
        email: email
      })

      // Invalid email
      if (validationResult.valid !== true) {
        const message = validationResult.schema
          ? 'Body did not match schema ' + validationResult.schema
          : 'Body did not pass validation'
        throw new InvalidBodyError(message)
      }

      try {
        // TODO verification
        yield this.save()
      } catch (e) {
        // Email is already taken by someone else
        if (e.name === 'SequelizeUniqueConstraintError') {
          throw new EmailTakenError("Email is already taken")
        }

        // Something else went wrong
        throw new ServerError("Failed to change the user email")
      }

      return this
    }

    * appendLedgerAccount (ledgerUser) {
      if (!ledgerUser) {
        ledgerUser = yield ledger.getAccount(this, true)
      }
      this.balance = Math.round(ledgerUser.balance * 100) / 100

      return this
    }
  }

  User.validateExternal = validator.create('User')

  PersistentModelMixin(User, sequelize, {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      unique: true
    },
    account: {
      type: Sequelize.STRING,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      unique: true
    },
    github_id: {
      type: Sequelize.INTEGER,
      unique: true
    },
    profile_picture: Sequelize.STRING
  })

  return User
}
