const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.createTable('Receivers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      name: Sequelize.STRING,
      webhook: Sequelize.STRING,
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
      .then(() => sequelize.queryInterface.addIndex(
        'Receivers',
        ['user', 'name'],
        {
          indexName: 'Receivers_user_name_idx',
          indicesType: 'UNIQUE'
        }
      ))
  },
  down: (sequelize) => {
    return sequelize.queryInterface.dropIndex('Receivers', 'Receivers_user_name_idx')
      .then(() => sequelize.queryInterface.dropTable('Receivers'))
  }
}
