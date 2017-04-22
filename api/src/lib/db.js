'use strict'

const path = require('path')
const Sequelize = require('sequelize')
const Umzug = require('umzug')
const Config = require('./config')
const Log = require('./log')

const AbstractDatabase = require('five-bells-shared').DB(Sequelize)

module.exports = class Database extends AbstractDatabase {
  static constitute () { return [ Config, Log ] }
  constructor (config, log) {
    super(config.data.getIn(['db', 'uri']), {
      logging: log('sequelize').debug,
      omitNull: true
    })

    this.umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this
      },
      migrations: {
        params: [this],
        path: path.resolve(__dirname, '..', 'migrations')
      }
    })
  }

  migrate () {
    return this.umzug.up()
  }
}
