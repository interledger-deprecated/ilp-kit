module.exports = {
  up: sequelize => {
    return sequelize.query('ALTER TABLE "public"."Settlements"' +
      'DROP CONSTRAINT "Settlements_peer_id_fkey",' +
      'DROP CONSTRAINT "Settlements_settlement_method_id_fkey",' +
      'ADD FOREIGN KEY ("peer_id") REFERENCES "public"."Peers"("id") ON DELETE SET NULL,' +
      'ADD FOREIGN KEY ("settlement_method_id") REFERENCES "public"."SettlementMethods"("id") ON DELETE SET NULL')
  },
  down: sequelize => {
    return sequelize.query('ALTER TABLE "public"."Settlements"' +
      'DROP CONSTRAINT "Settlements_peer_id_fkey",' +
      'DROP CONSTRAINT "Settlements_settlement_method_id_fkey",' +
      'ADD FOREIGN KEY ("peer_id") REFERENCES "public"."Peers"("id"),' +
      'ADD FOREIGN KEY ("settlement_method_id") REFERENCES "public"."SettlementMethods"("id")')
  }
}
