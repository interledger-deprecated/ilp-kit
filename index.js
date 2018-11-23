const Hubbie =  require('hubbie');
const static = require('node-static');
const bcrypt = require('bcrypt');
const atob = require('atob');
const { Pool } = require('pg');
let pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/snap',
  ssl: true
});
function snapOut(userId, obj) {
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

const file = new static.Server('./public');
 
function handler (req, res) {
  let body = '';
  req.on('data', (chunk) => {
     body += chunk;
  });
  req.on('end', () => {
    const [ leading, resource, index ] = req.url.split('/');
    switch(resource) {
      case 'session': {
        try {
          console.log(req.headers);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          checkPass(username, password).then((user_id) => {
            res.end(JSON.stringify({  username, ok: (user_id !== false) }));
          });
        } catch(e) {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        }
        break;
      };
      case 'pay': {
        Promise.resolve().then(() => {
          console.log(req.headers);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          return checkPass(username, password);
        }).then((userId) => {
          if (userId === false) {
            throw new Error('auth fail');
          }
          return snapOut(userId, JSON.parse(body));
        }).then((transactionId) => {
          res.end(JSON.stringify({  transactionId }));
        }).catch((e) => {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        });
        break;
      };
      case 'contacts':
      case 'transactions': {
        try {
          console.log(resource, req.headers.authorization, req.method, body);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          checkPass(username, password).then((user_id) => {
            if (user_id === false) {
              throw new Error('auth error');
            }
            if (req.method == 'POST' && !isNaN(index)) {
              const obj = JSON.parse(body);
              console.log('saving', resource, index, obj);
              if (resource == 'contacts') {
                runSql('INSERT INTO contacts ("user_id", "name", "url", "token", "min", "max", "current", "payable", "receivable") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);', [user_id, obj.name, obj.url, obj.token, obj.min, obj.max, obj.current, obj.payable, obj.receivable ]);
              }
              if (resource == 'transactions') {
                runSql('INSERT INTO transactions ("user_id", "requested_at", "description", "direction", "amount") VALUES ($1, $2, $3, $4, $5);', [user_id, obj.date, obj.description, obj.direction, obj.amount]);
              }
            }
            const columns  = {
              contacts: '"user_id", "name", "url", "token", "min", "payable", "current", "receivable", "max"',
              transactions: '"user_id", "requested_at", "description", "direction", "amount"'
            };
            runSql(`SELECT ${columns[resource]} FROM ${resource} WHERE user_id = $1;`, [ user_id ]).then(data => {
              res.end(JSON.stringify({
                ok: true,
                [resource]: data
              }));
            });
          });
        } catch(e) {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        }
        break;
      };
      default: {
        file.serve(req, res);
      };
    };
  });
}

const hubbie = new Hubbie();

async function runSql(query, params) {
  if (!pool) {
    console.log('ERROR! NO DATABASE CONNECTION!');
    return null;
  }
  console.log('running sql', query, params);
  try {
    const client = await pool.connect();
    console.log('query', query, params);
    const result = await client.query(query, params);
    const results = (result && result.rowCount) ? result.rows : null;
    // console.log('sql results', result, results);
    client.release();
    return results;
  } catch (err) {
    console.log('DATABASE ERROR!');
    console.error(err);
    // throw err;
  }
}
function checkPass(username, password)  {
  console.log('checking  password', username, password);
  return runSql('SELECT id, secrethash FROM users WHERE name=$1', [
    username
  ]).then(results => {
    console.log('sql query result', results);
    if (results == null) {
      console.log('registering!', username);
      return bcrypt.hash(password, 10).then((hash) => {
        console.log({ hash });
        return runSql('INSERT INTO users (name, secrethash) VALUES ($1, $2)', [
          username,
          hash
        ]);
      }).then((inserted) => {
        console.log('returning inserted', inserted);
        return inserted;
      });
    } else {
      const secretHash = results[0].secrethash;
      console.log('returning compare', results, password, secretHash);
      return bcrypt.compare(password, secretHash).then(ret => {
        console.log({ ret }, 'user_id:', ret && results[0].id);
        return ret && results[0].id;
      });
    }
  });
}

hubbie.on('peer', (eventObj) => {
  console.log('hubbie peer!', eventObj);
  return runSql('select c.token from users u join contacts c on u.id=c.user_id where u.name= $1 and c.name= $2', [
    eventObj.userName,
    eventObj.peerName,
  ]).then(results => {
    return results && results.length && eventObj.peerSecret == results[0].token;
  });
});

hubbie.on('message', (peerName, message, userName) => {
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
});

hubbie.listen({
  port: process.env.PORT || 3000,
  multiUser: true,
  handler
});
runSql('SELECT now();').then(result => {
  console.log({ result });
});
