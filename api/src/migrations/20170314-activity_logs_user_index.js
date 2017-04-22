module.exports = {
  up: sequelize => {
    return sequelize.query('ALTER TABLE "public"."ActivityLogs"' +
      'ADD FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE SET NULL')
  },
  down: sequelize => {
    return sequelize.query('ALTER TABLE "public"."ActivityLogs"' +
      'DROP CONSTRAINT "Activity_logs_user_id_fkey"')
  }
}
