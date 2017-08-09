const Sequelize = require('sequelize')

module.exports = {
  up: sequelize => {
    return sequelize.queryInterface.addColumn('Settlements', 'user_id', Sequelize.INTEGER)
      .then(() => sequelize.query('ALTER TABLE "public"."Settlements"' +
        'ADD FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE SET NULL'))
  },
  down: sequelize => {
    return sequelize.query('ALTER TABLE "public"."Settlements"' +
      'DROP CONSTRAINT "Settlements_user_id_fkey"')
      .then(() => sequelize.queryInterface.removeColumn('Users', 'user_id'))
  }
}
