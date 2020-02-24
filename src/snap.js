const hashlocks = require('hashlocks');

const db = require('./db');
const routing = require('./routing');
const { newTransaction } = require('./ledger');

async function snapOut(user, objIn, hubbieSend) {
  if (typeof user !== 'object') {
    throw new Error('snapOut: user not an object');
  }
  if (typeof objIn !== 'object') {
    throw new Error('snapOut: obj not an object');
  }
  if (typeof objIn.amount !== 'number') {
    throw new Error('snapOut: obj.amount not a number');
  }
  if (typeof objIn.contactName !== 'string') {
    throw new Error('snapOut: obj.contactName not a string');
  }
  const maxId = await db.getValue('SELECT MAX(msgId) AS value FROM transactions', []);
  const obj = Object.assign(objIn, {
    msgId: (maxId || 0) + 1,
  });
  // console.log('snapOut', user, obj);
  // console.log('will create transaction with msgId', obj.msgId);
  const contact = await db.getObject('SELECT * FROM contacts WHERE user_id= $1  AND name = $2', [user.id, obj.contactName]);
  // console.log('sending out SNAP to contact', contact);
  try {
    await newTransaction(user, contact, obj, 'OUT', hubbieSend);
  } catch (e) {
    // console.error('snapOut fail', e.message);
    throw e;
  }
  // console.log('hubbie send out', userId, contact, inserted, obj);
  // in server-to-server http cross post,
  // the existence of a contact allows incoming http but also outgoing
  // a useful common practice is if the username+token is the same in both directions
  // when that happens, hubbie channels can be used in both directions.
  // When not, you would use two hubbie channels, one dedicated for incoming, and one
  // for outgoing. Not a big deal, but unnecessarily confusing.
  // Only downside: you need to give your peer a URL that ends in the name they havei
  // in your addressbook.
  // For now, we use a special hubbie channel to make the outgoing call:
  return hubbieSend(user, contact, {
    msgType: 'PROPOSE',
    msgId: obj.msgId,
    amount: obj.amount,
    description: obj.description,
    condition: obj.condition,
  });
}

async function usePreimage(obj, user, hubbieSend) {
  const hash = hashlocks.sha256(Buffer.from(obj.preimage, 'hex')).toString('hex');
  // console.log('usePreimage', hash, obj);
  const backPeer = await db.getObject('SELECT incoming_peer_id, incoming_msg_id FROM forwards WHERE user_id =  $1 AND hash = $2', [
    user.id,
    hash,
  ]);
  const contact = await db.getObject('SELECT name, url, token, min, max FROM contacts WHERE user_id= $1  AND id = $2', [user.id, backPeer.incoming_peer_id]);
  // console.log('using in backwarded ACCEPT', contact, backPeer);
  return hubbieSend(user, contact, {
    msgType: 'ACCEPT',
    msgId: backPeer.incoming_msg_id,
    preimage: obj.preimage,
  });
  // TODO: store preimages in case backPeer repeats the PROPOSE,
  // and then delete preimage rows once ACCEPT was ACKed and e.g. a week has passed
}

async function updateContact(obj, user, contact, attempt) {
  let name = obj.myName;
  if (attempt > 1) {
    name += ` ${attempt}`;
  }
  try {
    await db.runSql('UPDATE contacts SET "name" = $1, "url" = $2, "max" = $3 WHERE "user_id"= $4 AND "id" = $5', [name, obj.url, obj.trust, user.id, contact.id]);
  } catch (e) {
    if (e.message === 'duplicate key value violates unique constraint "unq_userid_name"') {
      return updateContact(obj, user, contact, attempt + 1);
    }
    throw e;
  }
  return true;
}

async function snapIn(user, contact, message, hubbieSend) {
  let obj;
  try {
    obj = JSON.parse(message);
  } catch (e) {
    throw new Error('message not json');
  }
  async function updateStatus(newStatus, direction) {
    return db.runSql('UPDATE transactions SET status = $1, responded_at = now() WHERE '
        + 'msgid = $2 AND user_id = $3 AND contact_id = $4 AND direction = $5 AND status = \'pending\'',
    [newStatus, obj.msgId, user.id, contact.id, direction]);
  }

  switch (obj.msgType) {
    case 'ACCEPT': {
      // console.log('ACCEPT received', userName, peerName, obj);
      updateStatus('accepted', 'OUT');
      if (obj.preimage) {
        try {
          await usePreimage(obj, user, hubbieSend);
        } catch (e) {
          // console.log('ALAS, no backpeer found - or maybe I was the loop initiator');
        }
      }
      break;
    }
    case 'REJECT': {
      // console.log('REJECT received', userName, peerName, obj);
      updateStatus('rejected', 'OUT');
      break;
    }
    case 'PROPOSE': {
      let result = 'ACCEPT';
      let preimage;
      try {
        if (obj.condition) {
          try {
            preimage = await db.getValue('SELECT preimage AS value FROM preimages WHERE user_id = $1 AND hash = $2', [user.id, obj.condition]);
          } catch (e) {
            // console.log('preimage  not found!~');
            // select a different peer at random:
            // console.log({ forwardPeer });
            await db.runSql('INSERT INTO forwards (user_id, incoming_peer_id, incoming_msg_id, outgoing_peer_id, hash) VALUES ($1, $2, $3, $4, $5)', [
              user.id,
              contact.id,
              obj.msgId,
              contact.id,
              obj.condition,
            ]);
            snapOut(user.id, {
              contactName: contact.name,
              condition: obj.condition,
              description: `DEBUG: multi-hop to ${contact.name}`,
              amount: obj.amount,
            }, hubbieSend);
          }
        }
        // console.log({ preimage });
        // console.log('snapIn try start');
        await newTransaction(user, contact, obj, 'IN', hubbieSend);
        // TODO: could also do these two sql queries in one
        // console.log('incoming proposal accepted');
        await updateStatus('accepted', 'IN');
        // console.log('snapIn try end');
      } catch (e) {
        // console.error('snapIn fail', e.message);
        // TODO: could also do these two sql queries in one
        await updateStatus('rejected', 'IN');
        // console.log('incoming proposal rejected');
        result = 'REJECT';
      }
      // console.log('hubbie send back out', obj, channelName, user.id);
      return hubbieSend(user, contact, {
        msgType: result,
        msgId: obj.msgId,
        preimage,
      });
      // break; // unreachable
    }
    case 'ROUTING': {
      // console.log('incoming routes!', user, contact, obj);
      await routing.storeAndForwardRoutes(user, contact, obj, hubbieSend);
      break;
    }
    case 'FRIEND-REQUEST': {
      await updateContact(obj, user, contact, 1);
      await routing.sendRoutesToNewContact(user, contact, hubbieSend);
      break;
    }
    default:
  }
  // console.log('snapIn done');
  return Promise.resolve();
}

module.exports = { snapIn, snapOut };
