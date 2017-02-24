'use strict'

module.exports = UserFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Ledger = require('../lib/ledger')
const Config = require('../lib/config')
const Utils = require('../lib/utils')
const Sequelize = require('sequelize')

const ServerError = require('../errors/server-error')
const InvalidBodyError = require('../errors/invalid-body-error')
const EmailTakenError = require('../errors/email-taken-error')

UserFactory.constitute = [Database, Validator, Ledger, Config, Utils]
function UserFactory (sequelize, validator, ledger, config, utils) {
  class User extends Model {
    static convertFromExternal(data) {
      return data
    }

    static convertToExternal(data) {
      delete data.password
      delete data.created_at
      delete data.updated_at

      if (data.profile_picture && data.profile_picture.indexOf('://') === -1) {
        data.profile_picture = config.data.getIn(['server', 'base_uri'])
          + '/users/' + data.username + '/profilepic'
      }

      return data
    }

    static convertFromPersistent(data) {
      data = _.omit(data, _.isNull)

      data.identifier = utils.getWebfingerAddress(data.username)

      if (data.username === config.data.getIn(['ledger', 'admin', 'user'])) {
        data.isAdmin = true
      }

      return data
    }

    static convertToPersistent(data) {
      return data
    }

    static createBodyParser() {
      const Self = this

      return function * (next) {
        const json = this.body
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

    static * setupAdminAccount() {
      const username = config.data.getIn(['ledger', 'admin', 'user'])

      let dbUser = yield this.findOne({ where: { username } })

      if (!dbUser) {
        // Create the admin account
        dbUser = new this()

        dbUser.username = username

        dbUser = this.fromDatabaseModel(yield dbUser.save())

        dbUser.new = true
      }

      // Setup ledger admin account
      const ledgerAccount = yield ledger.setupAdminAccount()

      return yield dbUser.appendLedgerAccount(ledgerAccount)
    }

    static * setupConnectorAccount() {
      const ledgers = JSON.parse(config.data.getIn(['connector', 'ledgers']))
      const prefix = config.data.getIn(['ledger', 'prefix'])

      if (!ledgers || !ledgers[prefix]) return

      const options = ledgers[prefix].options

      // backwards compatibility (dec, 2016)
      const derivedUsername = options.account.split('accounts/')[1]

      const username = options.username || derivedUsername
      const password = options.password

      let dbUser = yield this.findOne({ where: { username } })

      // Create the db connector account
      if (!dbUser) {
        dbUser = new this()

        dbUser.username = username

        dbUser = this.fromDatabaseModel(yield dbUser.save())

        // Used in app.js for the initial funding
        dbUser.new = true
      }

      let ledgerAccount

      // Create the ledger connector account
      try {
        // Does the account already exist?
        ledgerAccount = yield ledger.getAccount({ username, password })
      } catch (err) {
        // TODO does account not exist or is this a different exception?

        // Create the account
        ledgerAccount = yield ledger.createAccount({ username, password })
      }

      return yield dbUser.appendLedgerAccount(ledgerAccount)
    }

    * changeEmail(email, verified) {
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
          throw new EmailTakenError('Email is already taken')
        }

        // Something else went wrong
        throw new ServerError('Failed to change the user email')
      }

      return this
    }

    * appendLedgerAccount (ledgerUser) {
      if (!ledgerUser) {
        ledgerUser = yield ledger.getAccount(this, true)
      }
      this.balance = Math.round(ledgerUser.balance * 100) / 100
      this.minimum_allowed_balance = ledgerUser.minimum_allowed_balance

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
      if (!code) throw new InvalidBodyError('Missing code')

      const parts = code.split('.')
      const date = parts[0]
      const hash = parts[1]

      if (!date || !hash) throw new InvalidBodyError('Invalid code')

      const currentDate = Math.floor(Date.now() / 1000)

      // Code is only valid for an hour
      console.log('CURRENT:', currentDate, date)
      if (currentDate > date + 3600) {
        // TODO should this be an invalid body error?
        throw new InvalidBodyError('The code has been expired')
      }

      if (code !== this.generateForgotPasswordCode(date)) {
        throw new InvalidBodyError('The code is invalid or has already been used')
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
    profile_picture: Sequelize.STRING,
    name: {
      type: Sequelize.STRING
    },
    phone: Sequelize.STRING,
    address1: Sequelize.STRING,
    address2: Sequelize.STRING,
    city: Sequelize.STRING,
    region: Sequelize.STRING,
    country: Sequelize.STRING,
    zip_code: Sequelize.STRING
  })

  return User
}
