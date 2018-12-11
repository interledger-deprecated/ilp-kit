// var randomBytes = require('randombytes');
const db = require('./db');
const balances = require('./balances');

async function sendRoutes(userId, contactId, hubbie) {
  // console.log('async function sendRoutes', userId, contactId, hubbie);
  const receivable = await balances.getTheirReceivable(userId, contactId);
  const payable = await balances.getTheirPayable(userId, contactId);
  const current = await balances.getTheirCurrent(userId, contactId);
  const contact = await db.getObject('SELECT * FROM contacts WHERE user_id= $1  AND id = $2', [userId, contactId]);
  // console.log(`CHECK1] ${contact.max} - ${current} - ${receivable}`);
  // when sending money to a contact, their balance  goes up
  // a limit for that is theirMax - theirCurrent - theirReceivable
  const limitTo = (contact.max - current - receivable);
  // when receiving money from a contact, their balance goes down
  // a limit for that is -theirMin + theirCurrent - theirPayable
  const limitFrom = (-contact.min - current - payable);
  const list = await db.runSql('SELECT * FROM routes WHERE user_id = $1 AND contact_id != $2', [userId, contactId]);
  // const randomString = randomBytes(8).toString('hex');
  const canRoute = {
    [contact.landmark]: {
      max_to: limitTo,
      max_from: limitFrom,
    },
  };
  if (list) {
    list.map((entry) => {
      canRoute[entry.landmark] = {
        max_to: Math.min(limitTo, entry.max_to),
        max_from: Math.min(limitFrom, entry.max_from),
      };
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

async function storeAndForwardRoutes(userName, peerName, obj, hubbie) {
  const user = await db.getObject('SELECT id FROM users WHERE name = $1', [userName]);
  const contacts = await db.runSql('SELECT id, url, token, min, max FROM contacts WHERE user_id= $1', [user.id]);
  // console.log('storeAndForward', contacts, userName, peerName, obj);
  return Promise.all(contacts.map(async (contact) => {
    if (contact.name === peerName) {
      // const receivable = await balances.getMyReceivable(user.id, contact.id);
      const payable = await balances.getMyPayable(user.id, contact.id);
      const current = await balances.getMyCurrent(user.id, contact.id);
      // console.log(`CHECK3] ${current} - ${payable} - ${contact.min}`);
      const limit = (current - payable - contact.min);
      return Object.keys(obj.canRoute).map(landmark => db.runSql(
        'INSERT INTO routes (user_id, contact_id, landmark, amount) VALUES ($1, $2, $3, $4)', [
          user.id,
          contact.id,
          landmark,
          Math.min(obj.canRoute[landmark], limit),
        ],
      ));
    }
    return sendRoutes(user.id, contact.id, hubbie);
  }));
}

module.exports = { storeAndForwardRoutes, sendRoutes };
