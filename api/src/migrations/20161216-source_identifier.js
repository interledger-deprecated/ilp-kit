const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    return sequelize.queryInterface.addColumn('Payments', 'source_identifier', Sequelize.STRING)
      .then(() => sequelize.queryInterface.addColumn('Payments', 'destination_identifier', Sequelize.STRING))
      .then(() => sequelize.query('update "Payments" set source_identifier = textcat(textcat(substring(source_account from \'https?://.*/ledger/accounts/(.*)\'), \'@\'), substring(source_account from \'https?://(.*)/ledger/accounts\')), destination_identifier = textcat(textcat(substring(destination_account from \'https?://.*/ledger/accounts/(.*)\'), \'@\'), substring(destination_account from \'https?://(.*)/ledger/accounts\'))'))
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'source_account'))
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'destination_account'))
  },
  down: (sequelize) => {
    // The source_account, destination_account data will be lost
    return sequelize.queryInterface.removeColumn('Payments', 'source_identifier')
      .then(() => sequelize.queryInterface.removeColumn('Payments', 'destination_identifier'))
      .then(() => sequelize.queryInterface.addColumn('Payments', 'source_account', Sequelize.STRING))
      .then(() => sequelize.queryInterface.addColumn('Payments', 'destination_account', Sequelize.STRING))
  }
}
