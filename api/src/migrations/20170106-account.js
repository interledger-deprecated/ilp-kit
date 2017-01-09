const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.removeColumn('Users', 'account')
  },
  down: (sequelize) => {
    return sequelize.queryInterface.addColumn('Users', 'account', Sequelize.STRING)
  }
}
