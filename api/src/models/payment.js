"use strict"

module.exports = PaymentFactory

const _ = require('lodash')
const Container = require('constitute').Container
const Model = require('five-bells-shared').Model
const InvalidBodyError = require('five-bells-shared/errors/invalid-body-error')
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Database = require('../lib/db')
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')
const UserFactory = require('./user')

PaymentFactory.constitute = [Database, Validator, Container, UserFactory]
function PaymentFactory (sequelize, validator, container, User) {
  class Payment extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      return data
    }

    static convertFromPersistent (data) {
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

    static * getUserPayments(user, page, limit) {
      page = page > 0 ? Number(page) : 1
      limit = Number(limit)

      // TODO the current grouping mechanism is not ideal.
      //  It groups by time intervals, so the same payment stream can be
      //  represented in different rows, and different payment streams can
      //  appear in the same row

      // TODO switch to a legit sequalize format

      const list = yield sequelize.query(
        'SELECT source_account, destination_account,'
          + ' sum(source_amount) as source_amount,'
          + ' sum(destination_amount) as destination_amount,'
          + ' message,'
          + ' date_trunc(\'minute\', created_at) AS time_slot,'
          + ' count(*) as transfers'
        + ' FROM "Payments"'
        + ' WHERE state = \'success\' '
          + ' AND ('
            + ' source_user = ' + user.id
            + " OR source_account = '" + user.account + "'"
            + ' OR destination_user = ' + user.id
            + " OR destination_account = '" + user.account + "'"
          + ' )'
        + ' GROUP BY source_account, destination_account, message, time_slot'
          // TODO order by doesn't work correctly. probably because of the time_slot value
        + ' ORDER BY time_slot DESC'
        + ' OFFSET ' + limit * (page - 1)
        + ' LIMIT ' + limit,
        {model: Payment.DbModel}
      )

      // TODO:PERFORMANCE this selects the rows
      const count = yield sequelize.query(
        'SELECT count(source_amount), destination_account,'
          + ' sum(source_amount) as source_amount,'
          + ' sum(destination_amount) as destination_amount,'
          + ' message,'
          + ' date_trunc(\'minute\', created_at) AS time_slot'
        + ' FROM "Payments"'
        + ' WHERE state = \'success\' '
          + ' AND ('
            + ' source_user = ' + user.id
            + " OR source_account = '" + user.account + "'"
            + ' OR destination_user = ' + user.id
            + " OR destination_account = '" + user.account + "'"
          + ' )'
        + ' GROUP BY source_account, destination_account, message, time_slot'
      )

      return {
        list,
        count: count[1].rowCount
      }

      return Payment.DbModel.findAndCountAll({
        // This is how we get a flat object that includes user username
        attributes: {include: [
          [Sequelize.col('SourceUser.username'), 'sourceUserUsername'],
          [Sequelize.col('SourceUser.profile_picture'), 'sourceUserProfilePicture'],
          [Sequelize.col('DestinationUser.username'), 'destinationUserUsername'],
          [Sequelize.col('DestinationUser.profile_picture'), 'destinationUserProfilePicture']
        ]},
        where: {
          $or: [
            {source_user: user.id},
            {source_account: user.account},
            {destination_user: user.id},
            {destination_account: user.account}
          ]
        },
        limit: limit,
        offset: limit * (page - 1),
        include: [
          // attributes: [] because we want a flat object. See above
          { model: User.DbModel, as: 'SourceUser', attributes: [] },
          { model: User.DbModel, as: 'DestinationUser', attributes: [] }
        ],
        order: [
          ['created_at', 'DESC']
        ]
      })
    }

    static getPayment (transfer) {
      return Payment.findOne({
        attributes: {include: [
          [Sequelize.col('SourceUser.username'), 'sourceUserUsername']
        ]},
        where: {
          transfer: transfer
        },
        include: [{
          model: User.DbModel, as: 'SourceUser', attributes: []
        }]
      })
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
    source_account: Sequelize.STRING(1024),
    destination_user: Sequelize.INTEGER,
    destination_account: Sequelize.STRING(1024),
    transfer: {
      type: Sequelize.STRING(512),
      unique: true
    },
    state: Sequelize.ENUM('pending', 'success', 'fail'),
    source_amount: Sequelize.FLOAT,
    destination_amount: Sequelize.FLOAT,
    message: Sequelize.STRING(1024), // TODO decide on the size
    execution_condition: Sequelize.STRING(1024), // TODO decide on the size
    created_at: Sequelize.DATE,
    completed_at: Sequelize.DATE
  })

  container.schedulePostConstructor((User) => {
    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'source_user',
      as: 'SourceUser'
    })
    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'destination_user',
      as: 'DestinationUser'
    })
  }, [ UserFactory ])

  return Payment
}