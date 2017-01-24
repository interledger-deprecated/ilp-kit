const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('Peers', 'destination', Sequelize.STRING)
      .then(() => sequelize.query('update "Peers" set destination = floor(random()*1000000)'))
  },
  down: sequelize => {
    return sequelize.queryInterface.removeColumn('Payments', 'destination')
  }
}
