const { getValue } = require('./db');

function getPendingBalance(user, contact, direction) {
  return getValue('SELECT SUM(amount) AS value FROM transactions WHERE user_id = $1 AND contact_id = $2 AND direction = $3 AND status = \'pending\'', [user.id, contact.id, direction]).then(val => parseInt(val || 0, 10));
}
function getMyReceivable(user, contact) {
  return getPendingBalance(user.id, contact.id, 'IN');
}
function getMyPayable(user, contact) {
  return getPendingBalance(user.id, contact.id, 'OUT');
}
function getMyCurrent(user, contact) {
  return getValue('SELECT SUM(amount * '
      + 'CASE direction WHEN \'IN\' THEN 1 WHEN \'OUT\' THEN -1 END'
      + ') AS value FROM transactions '
      + 'WHERE user_id = $1 AND contact_id = $2 AND status = \'accepted\'',
  [user.id, contact.id]).then(val => parseInt(val || 0, 10));
}
module.exports = {
  getMyReceivable,
  getMyPayable,
  getMyCurrent,
  getTheirReceivable: getMyPayable,
  getTheirPayable: getMyReceivable,
  getTheirCurrent(user, contact) {
    return getMyCurrent(user, contact).then(x => -x);
  },
};
