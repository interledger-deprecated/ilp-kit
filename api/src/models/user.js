"use strict"

module.exports = UserFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Ledger = require('../lib/ledger')
const Config = require('../lib/config')
const Sequelize = require('sequelize')

const ServerError = require('../errors/server-error')
const InvalidBodyError = require('../errors/invalid-body-error')
const EmailTakenError = require('../errors/email-taken-error')

UserFactory.constitute = [Database, Validator, Ledger, Config]
function UserFactory (sequelize, validator, ledger, config) {
  class User extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      delete data.password
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

    static getVerificationCode(email) {
      return config.generateSecret('verify' + email).toString('hex')
    }

    static getVerificationLink(username, email) {
      return config.data.get(['client_host']) + '/verify/' + username + '/' + User.getVerificationCode(email)
    }

    * changeEmail (email, verified) {
      if (this.email === email) return this

      this.email = email
      this.email_verified = verified || false

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

    generateForgotPasswordCode(date) {
      date = date || Math.floor(Date.now() / 1000)

      return date + '.' + config.generateSecret(+date + this.id + this.updated_at.toString()).toString('hex')
    }

    generateForgotPasswordLink() {
      return config.data.get(['client_host']) + '/change-password/' + this.username + '/' + this.generateForgotPasswordCode()
    }

    verifyForgotPasswordCode(code) {
      const parts = code.split('.')
      const date = parts[0]
      const hash = parts[1]

      if (!date || !hash) throw new InvalidBodyError("Invalid code")

      const currentDate = Math.floor(Date.now() / 1000)

      // Code is only valid for an hour
      if (currentDate > date + 3600) {
        // TODO should this be an invalid body error?
        throw new InvalidBodyError("The code has been expired")
      }

      if (code !== this.generateForgotPasswordCode(date)) {
        throw new InvalidBodyError("Invalid code")
      }
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
    name: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING,
      unique: true
    },
    email_verified: {
      type: Sequelize.BOOLEAN
    },
    github_id: {
      type: Sequelize.INTEGER,
      unique: true
    },
    profile_picture: Sequelize.STRING
  })

  return User
}
