'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('Payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      source_user: Sequelize.INTEGER,
      destination_user: Sequelize.INTEGER,
      destination_account: Sequelize.STRING(1024),
      transfers: Sequelize.ARRAY(Sequelize.STRING(1024)),
      state: Sequelize.ENUM('pending', 'success', 'fail'),
      source_amount: Sequelize.STRING(1024), // TODO put the right type
      destination_amount: Sequelize.STRING(1024), // TODO put the right type
      created_at: Sequelize.DATE,
      completed_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    })

    queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        unique: true
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('Payments')
    queryInterface.dropTable('Users')
  }
};
