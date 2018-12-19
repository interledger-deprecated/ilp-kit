// var randomBytes = require('randombytes');
const db = require('./db');
const balances = require('./balances');

async function restrictLimits(user, contact, obj) {
  const receivable = await balances.getTheirReceivable(user.id, contact.id);
  const payable = await balances.getTheirPayable(user.id, contact.id);
  const current = await balances.getTheirCurrent(user.id, contact.id);
  // they can forward network money to a landmark, but we only want them
  // to if that doesn't make their current + their receivable exceed their max balance
  // example:  balance 5, max 10, receivable 3  ->  limitTo = 10 - 5 - 3 = 2
  // example:  balance 8, max 10, receivable 3  ->  limitTo = 10 - 8 - 3 = -1
  // example:  balance 5, max 10, receivable 1  ->  limitTo = 10 - 5 - 1 = 4
  // example:  balance 5, max 12, receivable 3  ->  limitTo = 12 - 5 - 3 = 4
  const limitTo = Math.max(0, contact.max - current - receivable);
  // they can forward network money from a landmark, but we only want them
  // to if that doesn't make their current - their payable go below their min balance
  // example:  balance -5, min -10, payable 3  ->  limitFrom = -5 - 3 - (-10) = 2
  // example:  balance -5, min -12, payable 3  ->  limitFrom = -5 - 3 - (-12) = 4
  // example:  balance  5, min -10, payable 3  ->  limitFrom =  5 - 3 - (-10) = 12
  // example:  balance -5, min -10, payable 1  ->  limitFrom = -5 - 1 - (-10) = 4
  const limitFrom = Math.max(0, current - payable - contact.min);
  // console.log(contact, { receivable, payable, current, limitTo, limitFrom }, obj.canRoute);
  const canRoute = {};
  Object.keys(obj.canRoute).map((key) => { // eslint-disable-line array-callback-return
    canRoute[key] = {
      maxTo: (obj.canRoute[key].maxTo === null ? limitTo
        : Math.min(obj.canRoute[key].maxTo, limitTo)),
      maxFrom: (obj.canRoute[key].maxFrom === null ? limitFrom
        : Math.min(obj.canRoute[key].maxFrom, limitFrom)),
    };
  });
  return {
    msgType: 'ROUTING',
    canRoute,
  };
}

async function sendRoutes(userId, contactId, obj, hubbie) {
  const user = await db.getObject('SELECT * FROM users WHERE id = $1', [userId]);
  const contact = await db.getObject('SELECT * FROM contacts WHERE user_id = $1 AND id = $2', [userId, contactId]);
  const channelName = `{$user.name}/${contact.name}`;
  hubbie.addClient({
    peerUrl: contact.url,
    /* fixme: hubbie should omit myName before mySecret in outgoing url */
    myName: contact.token,
    peerName: channelName,
  });
  return hubbie.send(contact.name, JSON.stringify(obj), user.name);
}

async function sendRoutesToNewContact(userId, contactId, hubbie) {
  const routes = await db.runSql('SELECT * FROM routes WHERE user_id = $1', [userId]);
  const canRoute = {};
  function addRoute(label, maxTo, maxFrom) {
    if (canRoute[label] === undefined) {
      canRoute[label] = {
        maxTo,
        maxFrom,
      };
    } else {
      canRoute[label] = {
        maxTo: Math.max(canRoute[label].maxTo, maxTo),
        maxFrom: Math.max(canRoute[label].maxFrom, maxFrom),
      };
    }
  }
  routes.forEach((row) => {
    addRoute(row.landmark, row.max_to, row.max_from);
    addRoute(`${row.landmark}:${row.approach}`, row.max_to, row.max_from);
  });
  return sendRoutes(userId, contactId, {
    msgType: 'ROUTING',
    canRoute,
  }, hubbie);
}

async function storeAndForwardRoutes(userName, peerName, obj, hubbie) {
  const user = await db.getObject('SELECT * FROM users WHERE name = $1', [userName]);
  const receivedFrom = await db.getObject('SELECT * FROM contacts WHERE user_id = $1 AND name = $2', [user.id, peerName]);
  const contacts = await db.runSql('SELECT* FROM contacts WHERE user_id = $1', [user.id]);
  // console.log('storeAndForward', contacts, userName, peerName, obj, hubbie);
  await Promise.all(Object.keys(obj.canRoute).map((key) => {
    const [landmark, approach] = key.split(':');
    return db.runSql(
      'INSERT INTO routes (user_id, contact_id, landmark, approach, max_to, max_from) VALUES ($1, $2, $3, $4, $5, $6)', [
        user.id,
        receivedFrom.id,
        landmark,
        approach,
        obj.canRoute[key].maxTo,
        obj.canRoute[key].maxFrom,
      ],
    );
  }));
  const restricted = await restrictLimits(user.id, receivedFrom, obj);
  return Promise.all(contacts.map((contact) => {
    if (contact.id === receivedFrom.id) {
      return Promise.resolve();
    }
    return sendRoutes(user.id, contact.id, restricted, hubbie);
  }));
}

module.exports = { storeAndForwardRoutes, sendRoutes, sendRoutesToNewContact };
