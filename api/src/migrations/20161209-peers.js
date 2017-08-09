const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.createTable('Peers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      hostname: Sequelize.STRING,
      limit: Sequelize.FLOAT,
      currency: Sequelize.STRING,
      broker: Sequelize.STRING,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    })
  },
  down: (sequelize) => {
    return sequelize.queryInterface.dropTable('Peers')
  }
}
