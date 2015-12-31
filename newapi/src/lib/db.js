import Sequelize from 'sequelize'
import Config from './config'
import Log from './log'
import { DB } from 'five-bells-shared'

const AbstractDatabase = DB(Sequelize)

export default class Database extends AbstractDatabase {
  static constitute () { return [ Config, Log ] }
  constructor (config, log) {
    super(config.db.uri, {
      logging: log('sequelize').debug,
      omitNull: true
    })
  }
}