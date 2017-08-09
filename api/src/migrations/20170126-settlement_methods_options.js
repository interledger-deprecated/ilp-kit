const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('SettlementMethods', 'options', Sequelize.JSON)
  },
  down: sequelize => {
    return sequelize.queryInterface.removeColumn('SettlementMethods', 'options')
  }
}
