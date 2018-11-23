const  { runSql } = require('./db');

function snapOut(userId, obj, hubbie) {
  console.log('snapOut', obj);
  return runSql('SELECT id, url, token, min, payable, current, receivable, max FROM contacts WHERE user_id= $1  AND name = $2', [ userId, obj.contactName ]).then(results1 =>  {
    if (!results1 || !results1.length) {
      throw new Error('contact not found');
    }
    // their current balance will go up by amount
    if (results1[0].current + results1[0].receivable + obj.amount > results1[0].max) {
      throw new Error('peer could hit max balance');
    }
    // in case of neg amount:
    if (results1[0].current + results1[0].receivable + obj.amount < results1[0].min) {
      throw new Error('peer could hit min balance');
    }
    return runSql('INSERT INTO transactions (user_id, contact_id, requested_at, description,  direction, amount, status) ' +
                  'VALUES                   ($1,      $2,         now (),       $3,           \'OUT\',    $4,     \'pending\') RETURNING id', [
      userId,
      results1[0].id,
      obj.description,
      obj.amount
    ]).then((results2) => {
      if (!results2 || !results2.length) {
        throw new Error('insert failed');
      }
      console.log('hubbie send', obj, results1, results2);
      const peerName = userId + ':' + obj.contactName;
      hubbie.addClient({ peerUrl: results1[0].url, myName:/*fixme: hubbie should omit myName before mySecret in outgoing url*/ results1[0].token, peerName });
      return hubbie.send(peerName, JSON.stringify({
        msgType: 'PROPOSE',
        msgId: results2[0].id,
        amount: obj.amount,
        description: obj.description
      }));
    });
  });
}

function snapIn (peerName, message, userName, hubbie) {
  console.log('hubbie message!', { peerName, message, userName });
  let obj;
  try {
    obj = JSON.parse(message);
  } catch(e) {
    throw  new Error('message not json');
  }

  function updateStatus(newStatus) {
    let userId;
    let contactId; 
    runSql('SELECT id FROM users WHERE name = $1', [ userName ]).then((results1) => {
      if (!results1 || !results1.length) {
        throw new Error('userName for incoming message not found');
      }
      userId = results1[0].id;
      return runSql('SELECT id FROM contacts WHERE user_id = $1 AND name = $2', [ userId, peerName ]);
    }).then((results2) => {
      if (!results2 || !results2.length) {
        throw new Error('peerName for incoming message not found');
      }
      contactId = results2[0].id;
      return runSql('UPDATE transactions SET status = $1, responded_at = now() WHERE id = $2 AND user_id = $3 AND contact_id = $4 AND direction = \'OUT\' AND status = \'pending\'',
          [ newStatus, obj.msgId, userId, contactId  ]);
    });
  }

  switch (obj.msgType) {
    case 'ACCEPT': { updateStatus('accepted'); break; };
    case 'REJECT': { updateStatus('rejected'); break; };
    case  'PROPOSE': {
      let userId;
      let status = 'accepted';
      let channelName; // see FIXME comment below
      // resolve userName to userId
      runSql('SELECT id FROM users WHERE name = $1', [ userName ]).then(results1 =>  {
        if (!results1 || !results1.length) {
          throw new Error('userName for incoming snap message not found');
        }
        userId = results1[0].id;
        return runSql('SELECT id, url, token, min, payable, current, receivable, max FROM contacts WHERE user_id= $1  AND name = $2', [ userId, peerName ]);
      }).then(results2 =>  {
        if (!results2 || !results2.length) {
          throw new Error('peerName for incoming message not found');
        }
        // their current balance will go down by amount
        if (results2[0].current + results2[0].receivable - obj.amount < results2[0].min) {
          status = 'rejected';
        }
        // in case of neg amount:
        if (results2[0].current + results2[0].receivable - obj.amount > results2[0].max) {
          status = 'rejected';
        }
        // FIXME: even when using http, maybe this peer should already exist if a message is being received from them?
        channelName = userName + '/' + peerName; // match behavior of hubbie's internal channelName function
        hubbie.addClient({ peerUrl: results2[0].url, myName:/*fixme: hubbie should omit myName before mySecret in outgoing url*/ results2[0].token, peerName: channelName });
        return runSql('INSERT INTO transactions (user_id, contact_id, responded_at, description,  direction, amount, status) ' +
                      'VALUES                   ($1,      $2,         now (),       $3,           \'IN\',    $4,     $5) RETURNING id', [
          userId,
          results2[0].id,
          obj.description,
          obj.amount,
          status
        ]);
      }).then((results3) => {
        if (!results3 || !results3.length) {
          throw new Error('insert failed');
        }
        console.log('hubbie send', obj, results3,  userId, status);
        // see FIXME comment above about peerBackName
        return hubbie.send(peerName, JSON.stringify({
          msgType: (status === 'accepted' ?  'ACCEPT' : 'REJECT'),
          msgId: obj.msgId,
        }), userName);
      });
      break;
    };
  }
}

module.exports = { snapIn, snapOut };
