'use strict'

const path = require('path')
const Sequelize = require('sequelize')
const Umzug = require('umzug')
const Config = require('./config')
const Log = require('./log')

const AbstractDatabase = require('five-bells-shared').DB(Sequelize)

module.exports = class Database extends AbstractDatabase {
  constructor (deps) {
    const config = deps(Config)
    const log = deps(Log)

    // Only log the sql
    const sequelizeLog = (sql, details) => {
      return log('sequelize').debug(sql)
    }

    super(config.data.getIn(['db', 'uri']), {
      logging: sequelizeLog,
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
