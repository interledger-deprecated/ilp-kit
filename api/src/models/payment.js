"use strict"

module.exports = PaymentFactory

const _ = require('lodash')
const Container = require('constitute').Container
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

PaymentFactory.constitute = [Database, Validator, Container, UserFactory]
function PaymentFactory (sequelize, validator, container, User) {
  let ActivityLog

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

    // TODO:BEFORE_DEPLOY remove this
    static * getUserPayments (user, page, limit) {
      page = page > 0 ? Number(page) : 1
      limit = Number(limit)

      // TODO the current grouping mechanism is not ideal.
      //  It groups by time intervals, so the same payment stream can be
      //  represented in different rows, and different payment streams can
      //  appear in the same row

      // TODO switch to a legit sequalize format
      if (sequelize.options.dialect === 'sqlite') {
        return {
          list: yield sequelize.query(
            'SELECT source_identifier, destination_identifier,'
              + ' sum(source_amount) as source_amount,'
              + ' source_name,'
              + ' source_image_url,'
              + ' sum(destination_amount) as destination_amount,'
              + ' destination_name,'
              + ' destination_image_url,'
              + ' message,'
              + ' created_at AS time_slot,'
              + ' created_at AS recent_date,'
              + ' count(*) as transfers_count'
            + ' FROM "Payments"'
            + ' WHERE state = \'success\' '
              + ' AND ('
                + ' source_user = ' + user.id
                + " OR source_identifier = '" + user.identifier + "'"
                + ' OR destination_user = ' + user.id
                + " OR destination_identifier = '" + user.identifier + "'"
              + ' )'
            + ' GROUP BY source_identifier, source_name, source_image_url, '
              + 'destination_identifier, destination_name, destination_image_url,'
              + ' message, time_slot'
            + ' ORDER BY recent_date DESC'
            + ' LIMIT ' + limit
            + ' OFFSET ' + limit * (page - 1),
            {model: Payment.DbModel}
          ),
          count: yield sequelize.query(
            'SELECT count(source_amount), destination_identifier,'
              + ' sum(source_amount) as source_amount,'
              + ' sum(destination_amount) as destination_amount,'
              + ' message,'
              + ' created_at AS time_slot'
            + ' FROM "Payments"'
            + ' WHERE state = \'success\' '
              + ' AND ('
                + ' source_user = ' + user.id
                + " OR source_identifier = '" + user.identifier + "'"
                + ' OR destination_user = ' + user.id
                + " OR destination_identifier = '" + user.identifier + "'"
              + ' )'
            + ' GROUP BY source_identifier, destination_identifier, message, time_slot'
          )
        }
      }

      const list = yield sequelize.query(
        'SELECT source_identifier, destination_identifier,'
          + ' sum(source_amount) as source_amount,'
          + ' source_name,'
          + ' source_image_url,'
          + ' sum(destination_amount) as destination_amount,'
          + ' destination_name,'
          + ' destination_image_url,'
          + ' message,'
          + ' date_trunc(\'hour\', created_at) AS time_slot,'
          + ' max(created_at) AS recent_date,'
          + ' count(*) as transfers_count'
        + ' FROM "Payments"'
        + ' WHERE state = \'success\' '
          + ' AND ('
            + ' source_user = ' + user.id
            + " OR source_identifier = '" + user.identifier + "'"
            + ' OR destination_user = ' + user.id
            + " OR destination_identifier = '" + user.identifier + "'"
          + ' )'
        + ' GROUP BY source_identifier, source_name, source_image_url, '
          + 'destination_identifier, destination_name, destination_image_url,'
          + ' message, time_slot'
        + ' ORDER BY recent_date DESC'
        + ' LIMIT ' + limit
        + ' OFFSET ' + limit * (page - 1),
        {model: Payment.DbModel}
      )

      // TODO:PERFORMANCE this selects the rows
      const count = yield sequelize.query(
        'SELECT count(source_amount), destination_identifier,'
          + ' sum(source_amount) as source_amount,'
          + ' sum(destination_amount) as destination_amount,'
          + ' message,'
          + ' date_trunc(\'hour\', created_at) AS time_slot'
        + ' FROM "Payments"'
        + ' WHERE state = \'success\' '
          + ' AND ('
            + ' source_user = ' + user.id
            + " OR source_identifier = '" + user.identifier + "'"
            + ' OR destination_user = ' + user.id
            + " OR destination_identifier = '" + user.identifier + "'"
          + ' )'
        + ' GROUP BY source_identifier, destination_identifier, message, time_slot'
      )

      return {
        list,
        count: count[1].rowCount
      }
    }

    static getTransfers (params) {
      if (sequelize.options.dialect === 'sqlite') {
        return sequelize.query(
          'SELECT source_amount, destination_amount, created_at, transfer'
          + ' FROM "Payments"'
          + ' WHERE state = \'success\' '
          + " AND source_identifier = '" + params.sourceIdentifier + "'"
          + " AND destination_identifier = '" + params.destinationIdentifier + "'"
          + " AND created_at = '" + params.timeSlot + "'"
          + (params.message ? " AND message = '" + params.message + "'" : '')
          + ' ORDER BY created_at DESC',
          {model: Payment.DbModel}
        )
      }

      return sequelize.query(
        'SELECT source_amount, destination_amount, created_at, transfer'
      + ' FROM "Payments"'
      + ' WHERE state = \'success\' '
        + " AND source_identifier = '" + params.sourceIdentifier + "'"
        + " AND destination_identifier = '" + params.destinationIdentifier + "'"
        + " AND date_trunc('hour', created_at) = '" + params.timeSlot + "'"
        + (params.message ? " AND message = '" + params.message + "'" : '')
      + ' ORDER BY created_at DESC',
        {model: Payment.DbModel}
      )
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

    static * getUserStats (user) {
      const result = yield sequelize.query(
        'SELECT source_identifier, destination_identifier,'
          + ' sum(source_amount) as source_amount,'
          + ' source_name,'
          + ' source_image_url,'
          + ' sum(destination_amount) as destination_amount,'
          + ' destination_name,'
          + ' destination_image_url,'
          + ' count(*) as transfers_count,'
          + ' max(created_at) AS recent_date'
        + ' FROM "Payments"'
        + ' WHERE state = \'success\' '
        + ' AND ('
          + ' source_user = ' + user.id
          + " OR source_identifier = '" + user.identifier + "'"
          + ' OR destination_user = ' + user.id
          + " OR destination_identifier = '" + user.identifier + "'"
        + ' )'
        + ' GROUP BY source_identifier, source_name, source_image_url, '
        + 'destination_identifier, destination_name, destination_image_url'
        + ' ORDER BY recent_date DESC'
      )

      return result[0]
    }

    static * createOrUpdate (payment, activity) {
      debug('createOrUpdate', payment, activity)

      // Get the db entry
      let dbPayment = yield Payment.findOne({
        where: { execution_condition: payment.execution_condition }
      })

      debug('createOrUpdate payment', dbPayment)

      // Create the db entry if it doesn't exist yet
      if (!dbPayment) {
        dbPayment = new Payment()

        debug('createOrUpdate creating payment')
      }

      dbPayment.setDataExternal(payment)
      dbPayment = yield dbPayment.save()

      // TODO:BEFORE_DEPLOY grouping
      // TODO can you figure if an activity needs to be created without passing it to this method?
      // create the activity
      if (activity) {
        let activityLog = new ActivityLog()
        activityLog.user_id = dbPayment[activity === 'source' ? 'source_user' : 'destination_user']
        activityLog = yield activityLog.save()

        dbPayment.addActivityLog(activityLog)

        debug('createOrUpdate adding activity', activity)
      }

      return Payment.fromDatabaseModel(dbPayment)
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

  container.schedulePostConstructor(User => {
    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'source_user',
      as: 'SourceUser'
    })
    Payment.DbModel.belongsTo(User.DbModel, {
      foreignKey: 'destination_user',
      as: 'DestinationUser'
    })
  }, [ UserFactory ])

  container.schedulePostConstructor(model => {
    ActivityLog = model

    container.schedulePostConstructor(ActivityLogsItem => {
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
    }, [ ActivityLogsItemFactory ])
  }, [ ActivityLogFactory ])

  return Payment
}
