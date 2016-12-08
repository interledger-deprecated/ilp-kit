const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.addColumn('Payments', 'source_identifier', Sequelize.STRING)
      .then(() => sequelize.queryInterface.addColumn('Payments', 'destination_identifier', Sequelize.STRING))
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'source_account'))
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'destination_account'))
  },
  down: (sequelize) => {
    return sequelize.queryInterface.removeColumn('Payments', 'source_identifier')
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'destination_identifier'))
      .then(() => sequelize.queryInterface.addColumn('Payments', 'source_account', Sequelize.STRING))
      .then(() => sequelize.queryInterface.addColumn('Payments', 'destination_account', Sequelize.STRING))
  }
}
