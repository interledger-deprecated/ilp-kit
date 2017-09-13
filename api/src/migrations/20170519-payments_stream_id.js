const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('Payments', 'stream_id', Sequelize.STRING)
  },
  down: sequelize => {
    return sequelize.queryInterface.removeColumn('Payments', 'stream_id')
  }
}
