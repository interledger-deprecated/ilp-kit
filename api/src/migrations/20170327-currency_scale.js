const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.addColumn('Peers', 'currencyScale', {
      type: Sequelize.INTEGER,
      defaultValue: 9
    }).then(() => {
      return sequelize.queryInterface.renameColumn('Peers', 'currency', 'currencyCode')
    })
  },
  down: (sequelize) => {
    return sequelize.queryInterface.removeColumn('Peers', 'currencyScale').then(() => {
      return sequelize.queryInterface.renameColumn('Peers', 'currency', 'currencyCode')
    })
  }
}
