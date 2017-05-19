'use strict'

module.exports = PaymentFactory

const _ = require('lodash')
const Model = require('five-bells-shared').Model
const InvalidBodyError = require('five-bells-shared/errors/invalid-body-error')
const PersistentModelMixin = require('five-bells-shared').PersistentModelMixin
const Validator = require('five-bells-shared/lib/validator')
const Sequelize = require('sequelize')

const debug = require('debug')('ilp-kit:payment-model')
const Database = require('../lib/db')
const UserFactory = require('./user')
const ActivityLogFactory = require('./activity_log')
const ActivityLogsItemFactory = require('./activity_logs_item')

function PaymentFactory (deps) {
  const sequelize = deps(Database)
  const validator = deps(Validator)

  class Payment extends Model {
    static convertFromExternal (data) {
      return data
    }

    static convertToExternal (data) {
      delete data.source_user
      delete data.destination_user
      delete data.completed_at

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

      return async function (ctx, next) {
        let json = ctx.body
        const validationResult = Self.validateExternal(json)
        if (validationResult.valid !== true) {
          const message = validationResult.schema
            ? 'Body did not match schema ' + validationResult.schema
            : 'Body did not pass validation'
          throw new InvalidBodyError(message, validationResult.errors)
        }

        const model = new Self()
        model.setDataExternal(json)
        ctx.body = model

        await next()
      }
    }

    static async getUserStats (user) {
      const result = await sequelize.query(
        'SELECT source_identifier, destination_identifier,' +
          ' sum(source_amount) as source_amount,' +
          ' source_name,' +
          ' source_image_url,' +
          ' sum(destination_amount) as destination_amount,' +
          ' destination_name,' +
          ' destination_image_url,' +
          ' count(*) as transfers_count,' +
          ' max(created_at) AS recent_date' +
        ' FROM "Payments"' +
        ' WHERE state = \'success\' ' +
        ' AND (' +
          ' source_user = :id ' +
          ' OR source_identifier = :identifier ' +
          ' OR destination_user = :id ' +
          ' OR destination_identifier = :identifier ' +
        ' )' +
        ' GROUP BY source_identifier, source_name, source_image_url, ' +
        'destination_identifier, destination_name, destination_image_url' +
        ' ORDER BY recent_date DESC',
        {
          replacements: {id: user.id, identifier: user.identifier},
          type: sequelize.QueryTypes.SELECT
        }
      )

      return result[0]
    }

    static async createOrUpdate (payment) {
      debug('createOrUpdate', payment)

      // Get the db entry
      let dbPayment = await Payment.findOne({
        where: { transfer: payment.transfer }
      })

      debug('createOrUpdate payment', dbPayment)

      // Create the db entry if it doesn't exist yet
      if (!dbPayment) {
        dbPayment = new Payment()

        debug('createOrUpdate creating payment')
      }

      dbPayment.setDataExternal(payment)

      return dbPayment.save()
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
    source_identifier: Sequelize.STRING(1024),
    source_amount: Sequelize.FLOAT,
    source_name: Sequelize.STRING,
    source_image_url: Sequelize.STRING,
    destination_user: Sequelize.INTEGER,
    destination_identifier: Sequelize.STRING(1024),
    destination_amount: Sequelize.FLOAT,
    destination_name: Sequelize.STRING,
    destination_image_url: Sequelize.STRING,
    transfer: {
      type: Sequelize.STRING(512),
      unique: true
    },
    state: Sequelize.STRING('20'),
    message: Sequelize.STRING(1024), // TODO decide on the size
    execution_condition: Sequelize.STRING(1024), // TODO decide on the size
    stream_id: Sequelize.STRING,
    created_at: Sequelize.DATE,
    completed_at: Sequelize.DATE
  }, {
    indexes: [
      {
        name: 'Payments_execution_condition_idx',
        method: 'BTREE',
        fields: ['execution_condition']
      }
    ]
  })

  deps.later(() => {
    const User = deps(UserFactory)
    const ActivityLog = deps(ActivityLogFactory)
    const ActivityLogsItem = deps(ActivityLogsItemFactory)

    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'source_user',
      as: 'SourceUser'
    })

    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'destination_user',
      as: 'DestinationUser'
    })

    Payment.DbModel.belongsToMany(ActivityLog.DbModel, {
      through: {
        model: ActivityLogsItem.DbModel,
        unique: false,
        scope: {
          item_type: 'payment'
        }
      },
      foreignKey: 'item_id',
      constraints: false
    })
  })

  return Payment
}
