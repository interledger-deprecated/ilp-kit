const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.createTable('Settlements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      amount: Sequelize.FLOAT,
      currency: Sequelize.STRING,
      peer_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Peers',
          key: 'id'
        }
      },
      settlement_method_id: {
        type: Sequelize.UUID,
        references: {
          model: 'SettlementMethods',
          key: 'id'
        }
      },
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
  down: sequelize => {
    return sequelize.queryInterface.dropTable('Settlements')
  }
}
