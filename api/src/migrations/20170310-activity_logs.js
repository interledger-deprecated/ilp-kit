const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.createTable('ActivityLogsItems', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      activity_log_id: {
        type: Sequelize.UUID
      },
      item_type: {
        type: Sequelize.STRING
      },
      item_id: {
        type: Sequelize.UUID
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
    }).then(() => (
      sequelize.queryInterface.createTable('ActivityLogs', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        user_id: {
          type: Sequelize.INTEGER
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
    ))
  },
  down: (sequelize) => {
    return sequelize.queryInterface.dropTable('ActivityLogsItems')
      .then(() => (sequelize.queryInterface.dropTable('ActivityLogs')))
  }
}
