const db = require('./db');
const balances = require('./balances');

async function newTransaction(userId, contact, transaction, direction) {
  // console.log('newTransaction', userId, contact, transaction, direction);

  const receivable = await balances.getMyReceivable(userId, contact.id);
  const payable = await balances.getMyPayable(userId, contact.id);
  const current = await balances.getMyCurrent(userId, contact.id);
  if (direction === 'IN') {
    // their current balance will go up by amount
    // console.log(`CHECK1] ${current} + ${receivable} + ${transaction.amount} ?> ${contact.max}`);
    if (current + receivable + transaction.amount > contact.max) {
      // console.log(current, typeof current, receivable, typeof receivable,
      //      transaction, typeof transaction.amount, contact, typeof contact.max);
      throw new Error('peer could hit max balance (IN)');
    }
    // in case of neg amount:
    // console.log(`CHECK2] ${current} - ${payable} + ${transaction.amount} ?< ${contact.min}`);
    if (current - payable + transaction.amount < contact.min) {
      throw new Error('peer could hit min balance (IN)');
    }
  }
  if (direction === 'OUT') {
    // their current balance will go down by amount
    // console.log(`CHECK3] ${current} - ${payable} - ${transaction.amount} ?< ${contact.min}`);
    if (current - payable - transaction.amount < contact.min) {
      throw new Error('peer could hit min balance (OUT)');
    }
    // in case of neg amount:
    // console.log(`CHECK4] ${current} + ${receivable} - ${transaction.amount} ?> ${contact.max}`);
    if (current + receivable - transaction.amount > contact.max) {
      throw new Error('peer could hit max balance (OUT)');
    }
  }
  return db.getValue('INSERT INTO transactions '
      + '(user_id, contact_id, msgid, requested_at, description,  direction, amount, status) VALUES '
      + '($1,      $2,         $3,    now (),       $4,           $5,        $6,     \'pending\') RETURNING id AS value', [
    userId,
    contact.id,
    transaction.msgId,
    transaction.description,
    direction,
    transaction.amount,
  ]);
}

module.exports = { newTransaction };
