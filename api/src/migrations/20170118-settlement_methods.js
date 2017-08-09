const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.createTable('SettlementMethods', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      type: Sequelize.STRING,
      name: Sequelize.STRING,
      logo: Sequelize.STRING,
      description: Sequelize.STRING,
      uri: Sequelize.STRING,
      enabled: Sequelize.BOOLEAN,
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
    return sequelize.queryInterface.dropTable('SettlementMethods')
  }
}
