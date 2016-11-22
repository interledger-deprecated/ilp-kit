module.exports = {
  up: (migration, DataTypes) => {
    return migration
      .addColumn('Users', 'phone', DataTypes.STRING)
      .then(() => migration.addColumn('Users', 'address1', DataTypes.STRING))
      .then(() => migration.addColumn('Users', 'address2', DataTypes.STRING))
      .then(() => migration.addColumn('Users', 'city', DataTypes.STRING))
      .then(() => migration.addColumn('Users', 'region', DataTypes.STRING))
      .then(() => migration.addColumn('Users', 'country', DataTypes.STRING))
      .then(() => migration.addColumn('Users', 'zip_code', DataTypes.STRING))
  },

  down: (migration) => {
    return migration
      .removeColumn('Users', 'phone')
      .then(() => migration.removeColumn('Users', 'address1'))
      .then(() => migration.removeColumn('Users', 'address2'))
      .then(() => migration.removeColumn('Users', 'city'))
      .then(() => migration.removeColumn('Users', 'region'))
      .then(() => migration.removeColumn('Users', 'country'))
      .then(() => migration.removeColumn('Users', 'zip_code'))
  }
}
