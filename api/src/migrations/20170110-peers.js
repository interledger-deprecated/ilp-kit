const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.removeColumn('Peers', 'broker')
  },
  down: (sequelize) => {
    return sequelize.queryInterface.addColumn('Peers', 'broker', Sequelize.STRING)
  }
}
