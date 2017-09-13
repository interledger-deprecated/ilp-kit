const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('ActivityLogs', 'stream_id', Sequelize.STRING)
  },
  down: sequelize => {
    return sequelize.queryInterface.removeColumn('ActivityLogs', 'stream_id')
  }
}
