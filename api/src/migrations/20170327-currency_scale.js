const Sequelize = require('sequelize')

module.exports = {
  up: (sequelize) => {
    // create the new currencyScale column; previously, currencyScale was always zero
    return sequelize.queryInterface.addColumn('Peers', 'currencyScale', {
      type: Sequelize.INTEGER,
      defaultValue: 9
    }).then(() => {
      // change limit from float to integer, using <currencyScale>
      return sequelize.query('UPDATE "Peers" SET "limit" = ROUND("limit" * POWER(10, "currencyScale"));')
    }).then(() => {
      // now that limit is a big round number, we can alter the column to be integers
      return sequelize.queryInterface.changeColumn('Peers', 'limit', Sequelize.BIGINT)
    }).then(() => {
      // rename currency to currencyCode
      return sequelize.queryInterface.renameColumn('Peers', 'currency', 'currencyCode')
    })
  },
  down: (sequelize) => {
    // reverse of the above process
    // before scaling back the limit, make the column a float type again
    return sequelize.queryInterface.changeColumn('Peers', 'limit', Sequelize.FLOAT)
    .then(() => {
      // now change limit back from integer to float, using <currencyScale>
      return sequelize.query('UPDATE "Peers" SET "limit" = "limit" / POWER(10, "currencyScale");')
    }).then(() => {
      // now we can safely remove the currencyScale column; previously, currencyScale was always zero
      return sequelize.queryInterface.removeColumn('Peers', 'currencyScale')
    }).then(() => {
      // rename currencyCode back to currency
      return sequelize.queryInterface.renameColumn('Peers', 'currencyCode', 'currency')
    })
  }
}
