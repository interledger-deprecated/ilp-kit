const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('Users', 'destination', Sequelize.STRING)
      .then(() => sequelize.query('update "Users" set destination = floor(random()*1000000)'))
  },
  down: sequelize => {
    return sequelize.queryInterface.removeColumn('Users', 'destination')
  }
}
