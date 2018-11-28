// var randomBytes = require('randombytes');
const db = require('./db');
async function storeRoutes(userName, peerName, obj) {
  const user = await db.getObject('SELECT id FROM users WHERE name = $1', [ userName ]);
  const contact = await db.getObject('SELECT id, url, token, min, max FROM contacts WHERE user_id= $1  AND name = $2', [ user.id, peerName ]);
  const receivable = await balances.getMyReceivable(user.id, contact.id);
  const payable = await balances.getMyPayable(user.id, contact.id);
  const current = await balances.getMyCurrent(user.id, contact.id);
    console.log(`CHECK3] ${current} - ${payable} - ${contact.min}`);
  const limit  = (current -  payable - contact.min);
  for (let landmark in obj.canRoute) {
    console.log('storing', landmark, obj.canRoute[landmark], limit);
    db.runSql('INSERT INTO routes (user_id, contact_id, landmark, amount) VALUES ($1, $2, $3, $4)', [
      user.id,
      contact.id,
      landmark,
      Math.min(obj.canRoute[landmark], limit)
    ]);
  }
}

async function sendRoutes(userId, contactId, hubbie) {
  function getPendingBalance(direction) {
    return db.getValue('SELECT SUM(amount) AS value FROM transactions WHERE user_id = $1 AND contact_id = $2 AND direction = $3 AND status = \'pending\'', [ userId, contactId, direction ]).then(val => parseInt(val || 0));
  }
  const receivable = await getPendingBalance('IN');
  // calculate their current-payable-min balance as a max of how much you want to route through them
  const current = parseInt(await db.getValue('SELECT SUM(amount * CASE direction WHEN \'IN\' THEN 1 WHEN \'OUT\' THEN -1 END) AS value FROM transactions WHERE user_id = $1 AND contact_id = $2 AND status = \'accepted\'', [ userId, contactId ]) || 0);
  const contact = await db.getObject('SELECT * FROM contacts WHERE user_id= $1  AND id = $2', [ userId, contactId ]);
    console.log(`CHECK1] ${contact.max} - ${current} - ${receivable}`);
  const limit  = (contact.max - current - receivable);
  const list = await db.runSql('SELECT * FROM routes WHERE user_id = $1 AND contact_id != $2', [ userId, contactId ]);
  // const randomString = randomBytes(8).toString('hex');
  let canRoute = {
    [contact.landmark]: limit
  };
  if (list) {
    for (let entry of list) {
      canRoute[entry.landmark] = Math.max(limit, canRoute[entry.landmark], entry.amount);
    }
  }
  const peerName = userId + ':' + contact.name;
  hubbie.addClient({ peerUrl: contact.url, myName:/*fixme: hubbie should omit myName before mySecret in outgoing url*/ contact.token, peerName });
  return hubbie.send(peerName, JSON.stringify({
    msgType: 'ROUTING',
    canRoute
  }));
}

module.exports = { storeRoutes, sendRoutes };
