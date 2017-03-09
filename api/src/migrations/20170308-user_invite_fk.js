module.exports = {
  up: sequelize => {
    return sequelize.query('ALTER TABLE "public"."Users" ' +
      'ADD COLUMN "invite_code" UUID UNIQUE REFERENCES "public"."Invites"(code) ON UPDATE CASCADE ON DELETE SET NULL;')
  },
  down: sequelize => {
    return sequelize.query('ALTER TABLE "public"."Users" ' +
      'DROP COLUMN "invite_code"')
  }
}
