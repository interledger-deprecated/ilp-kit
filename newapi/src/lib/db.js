"use strict"

const Sequelize = require('sequelize')
const Config = require('./config')
const Log = require('./log')

const AbstractDatabase = require('five-bells-shared').DB(Sequelize)

module.exports = class Database extends AbstractDatabase {
  static constitute () { return [ Config, Log ] }
  constructor (config, log) {
    super(config.db.uri, {
      logging: log('sequelize').debug,
      omitNull: true
    })
  }
}