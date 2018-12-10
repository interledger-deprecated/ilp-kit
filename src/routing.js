// var randomBytes = require('randombytes');
const db = require('./db');
const balances = require('./balances');

async function storeRoutes(userName, peerName, obj) {
  const user = await db.getObject('SELECT id FROM users WHERE name = $1', [userName]);
  const contact = await db.getObject('SELECT id, url, token, min, max FROM contacts WHERE user_id= $1  AND name = $2', [user.id, peerName]);
  // const receivable = await balances.getMyReceivable(user.id, contact.id);
  const payable = await balances.getMyPayable(user.id, contact.id);
  const current = await balances.getMyCurrent(user.id, contact.id);
  // console.log(`CHECK3] ${current} - ${payable} - ${contact.min}`);
  const limit = (current - payable - contact.min);
  Object.keys(obj.canRoute).map(landmark => db.runSql(
    'INSERT INTO routes (user_id, contact_id, landmark, amount) VALUES ($1, $2, $3, $4)', [
      user.id,
      contact.id,
      landmark,
      Math.min(obj.canRoute[landmark], limit),
    ],
  ));
}

async function sendRoutes(userId, contactId, hubbie) {
  // console.log('async function sendRoutes', userId, contactId, hubbie);
  const receivable = await balances.getMyReceivable(userId, contactId);
  const current = await balances.getMyCurrent(userId, contactId);
  const contact = await db.getObject('SELECT * FROM contacts WHERE user_id= $1  AND id = $2', [userId, contactId]);
  // console.log(`CHECK1] ${contact.max} - ${current} - ${receivable}`);
  const limit = (-contact.min - current - receivable);
  const list = await db.runSql('SELECT * FROM routes WHERE user_id = $1 AND contact_id != $2', [userId, contactId]);
  // const randomString = randomBytes(8).toString('hex');
  const canRoute = {
    [contact.landmark]: limit,
  };
  if (list) {
    list.map((entry) => {
      canRoute[entry.landmark] = Math.min(limit, entry.amount);
      return undefined;
    });
  }
  const user = await db.getObject('SELECT name FROM users WHERE id = $1', [userId]); // FIXME: use only id's, not names
  const channelName = `{$user.name}/${contact.name}`;
  hubbie.addClient({
    peerUrl: contact.url,
    /* fixme: hubbie should omit myName before mySecret in outgoing url */
    myName: contact.token,
    peerName: channelName,
  });
  return hubbie.send(contact.name, JSON.stringify({
    msgType: 'ROUTING',
    canRoute,
  }), user.name);
}

module.exports = { storeRoutes, sendRoutes };
