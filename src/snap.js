const  { runSql, getObject, getValue } = require('./db');

async function newTransaction(userId, contact, transaction, direction, hubbie) {
  console.log('newTransaction', userId, contact, transaction, direction);
  function getPendingBalance(direction) {
    return getValue('SELECT SUM(amount) AS value FROM transactions WHERE user_id = $1 AND contact_id = $2 AND direction = $3 AND status = \'pending\'', [ userId, contact.id, direction ]).then(val => parseInt(val || 0));
  }

  const receivable = await getPendingBalance('IN');
  const payable = await getPendingBalance('OUT');
  const current = parseInt(await getValue('SELECT SUM(amount * CASE direction WHEN \'IN\' THEN 1 WHEN \'OUT\' THEN -1 END) AS value FROM transactions WHERE user_id = $1 AND contact_id = $2 AND status = \'accepted\'', [ userId, contact.id ]) || 0);
  if (direction === 'IN') {
    // their current balance will go up by amount
    console.log(`CHECK1] ${current} + ${receivable} + ${transaction.amount} ?> ${contact.max}`);
    if (current + receivable + transaction.amount > contact.max) {
      console.log(current, typeof current, receivable, typeof receivable, transaction, typeof transaction.amount, contact, typeof contact.max);
      throw new Error('peer could hit max balance (IN)');
    }
    // in case of neg amount:
    console.log(`CHECK2] ${current} - ${payable} + ${transaction.amount} ?< ${contact.min}`);
    if (current -  payable + transaction.amount < contact.min) {
      throw new Error('peer could hit min balance (IN)');
    }
  }
  if (direction === 'OUT') {
    // their current balance will go down by amount
    console.log(`CHECK3] ${current} - ${payable} - ${transaction.amount} ?< ${contact.min}`);
    if (current -  payable - transaction.amount < contact.min) {
      throw new Error('peer could hit min balance (OUT)');
    }
    // in case of neg amount:
    console.log(`CHECK4] ${current} + ${receivable} - ${transaction.amount} ?> ${contact.max}`);
    if (current + receivable - transaction.amount > contact.max) {
      throw new Error('peer could hit max balance (OUT)');
    }
  }
  return getValue('INSERT INTO transactions ' +
      '(user_id, contact_id, msgid, requested_at, description,  direction, amount, status) VALUES ' +
      '($1,      $2,         $3,    now (),       $4,           $5,        $6,     \'pending\') RETURNING id AS value', [
    userId,
    contact.id,
    transaction.msgId,
    transaction.description,
    direction,
    transaction.amount
  ]);
}

async function snapOut(userId, obj, hubbie) {
  if (typeof userId !== 'number') {
    throw new Error('snapOut: userId not a number');
  }
  if (typeof obj !== 'object') {
    throw new Error('snapOut: obj not an object');
  }
  if (typeof obj.amount !== 'number') {
    throw new Error('snapOut: obj.amount not a number');
  }
  if (typeof obj.contactName !== 'string') {
    throw new Error('snapOut: obj.contactName not a string');
  }
  const maxId = await getValue('SELECT MAX(msgId) AS value FROM transactions', []);
  obj.msgId = (maxId || 0) + 1;
  console.log('snapOut', userId, obj);
  console.log('will create transaction with msgId', obj.msgId);
  const contact = await getObject('SELECT id, url, token, min, max FROM contacts WHERE user_id= $1  AND name = $2', [ userId, obj.contactName ]);
  let inserted;
  try {
    inserted = await newTransaction(userId, contact, obj, 'OUT', hubbie);
  } catch (e) {
    console.error('snapOut fail', e.message);
    throw e;
  }
  console.log('hubbie send out', userId, contact, inserted, obj);
  const peerName = userId + ':' + obj.contactName;
  hubbie.addClient({ peerUrl: contact.url, myName:/*fixme: hubbie should omit myName before mySecret in outgoing url*/ contact.token, peerName });
  return hubbie.send(peerName, JSON.stringify({
    msgType: 'PROPOSE',
    msgId: obj.msgId,
    amount: obj.amount,
    description: obj.description,
    condition: obj.condition
  }));
}

async function snapIn (peerName, message, userName, hubbie) {
  console.log('hubbie message!', { peerName, message, userName });
  let obj;
  try {
    obj = JSON.parse(message);
  } catch(e) {
    throw  new Error('message not json');
  }
  console.log('snapIn message parsed', message);
  async function updateStatus(newStatus, direction) {
    const userId = await getValue('SELECT id AS value FROM users WHERE name = $1', [ userName ]);
    const contactId = await getValue('SELECT id AS value FROM contacts WHERE user_id = $1 AND name = $2', [ userId, peerName ]);
    return runSql('UPDATE transactions SET status = $1, responded_at = now() WHERE ' +
        'msgid = $2 AND user_id = $3 AND contact_id = $4 AND direction = $5 AND status = \'pending\'',
        [ newStatus, obj.msgId, userId, contactId, direction ]);
  }

  switch (obj.msgType) {
    case 'ACCEPT': { console.log('ACCEPT received', userName, peerName, obj); updateStatus('accepted', 'OUT'); break; };
    case 'REJECT': { console.log('REJECT received', userName, peerName, obj); updateStatus('rejected', 'OUT'); break; };
    case  'PROPOSE': {
      const user = await getObject('SELECT id FROM users WHERE name = $1', [ userName ]);
      const contact = await getObject('SELECT id, url, token, min, max FROM contacts WHERE user_id= $1  AND name = $2', [ user.id, peerName ]);
      let inserted;
      let result = 'ACCEPT';
      let preimage;
      try {
        if (obj.condition) {
          try {
            preimage = await getValue('SELECT preimage AS value FROM preimages WHERE user_id = $1 AND hash = $2', [ user.id, obj.condition ]);
          } catch (e) {
            console.log('preimage  not found!~');
            // select a different peer at random:
            const forwardPeer = await getObject('SELECT id, name FROM contacts WHERE user_id = $1 AND name != $2', [
              user.id,
              peerName
            ]);
            console.log({ forwardPeer });
            await runSql('INSERT INTO forwards (user_id, incoming_peer_id, outgoing_peer_id, hash) VALUES ($1, $2, $3, $4)', [
              user.id,
              contact.id,
              forwardPeer.id,
              obj.condition
            ]);
            snapOut(user.id, {
              contactName: forwardPeer.name,
              condition: obj.condition,
              description: 'DEBUG: multi-hop to ' + peerName,
              amount: obj.amount
            }, hubbie);
          }
        }
        console.log({ preimage });
        console.log('snapIn try start');
        inserted = await newTransaction(user.id, contact, obj, 'IN', hubbie);
        // TODO: could also do these two sql queries in one
         console.log('incoming proposal accepted');
        await updateStatus('accepted', 'IN');
        console.log('snapIn try end');
      } catch (e) {
        console.error('snapIn fail', e.message);
        // TODO: could also do these two sql queries in one
        await updateStatus('rejected', 'IN');
        console.log('incoming proposal rejected');
        result = 'REJECT';
      }
      let channelName; // see FIXME comment below
      // FIXME: even when using http, maybe this peer should already exist if a message is being received from them?
      channelName = userName + '/' + peerName; // match behavior of hubbie's internal channelName function
      hubbie.addClient({ peerUrl: contact.url, myName:/*fixme: hubbie should omit myName before mySecret in outgoing url*/ contact.token, peerName: channelName });
      console.log('hubbie send back out', obj, channelName, user.id);
      // see FIXME comment above about peerBackName
      return hubbie.send(peerName, JSON.stringify({
        msgType: result,
        msgId: obj.msgId,
        preimage
      }), userName);
      break;
    };
  }
}

module.exports = { snapIn, snapOut };
