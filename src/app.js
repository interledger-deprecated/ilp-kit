const Static = require('node-static');
const atob = require('atob');
const randomBytes = require('randombytes');

const db = require('./db');
const { snapOut, snapIn } = require('./snap');
const { loop } = require('./loops');
const routing = require('./routing');
const balances = require('./balances');
const friendForm = require('./friendForm');

const file = new Static.Server('./public');

function mixInBalances(user, contacts) {
  if (!contacts || !contacts.length) {
    return [];
  }
  async function addBalances(contact) {
    return Object.assign(contact, {
      payable: await balances.getTheirPayable(user, contact),
      receivable: await balances.getTheirReceivable(user, contact),
      current: await balances.getTheirCurrent(user, contact),
    });
  }
  return Promise.all(contacts.map(addBalances));
}

function mixInContactNames(transactions) {
  if (!transactions || !transactions.length) {
    return [];
  }
  async function addContactName(transaction) {
    // console.log('adding contact name', transaction);
    return Object.assign(transaction, {
      peerName: await db.getValue('SELECT name AS value FROM contacts WHERE id = $1 AND user_id = $2', [transaction.contact_id, transaction.user_id]),
    });
  }
  return Promise.all(transactions.map(addContactName));
}

function getData(user, resource) {
  const columns = {
    contacts: '"id", "user_id", "name", "url", "token", "min", "max"',
    transactions: '"user_id", "contact_id", "requested_at", "description", "direction", "amount"',
  };
  return db.runSql(`SELECT ${columns[resource]} FROM ${resource} WHERE user_id = $1;`, [user.id]).then((data) => {
    if (resource === 'contacts') {
      return mixInBalances(user, data);
    }
    if (resource === 'transactions') {
      return mixInContactNames(data);
    }
    return data;
  });
}

function makeHandler(hubbie) {
  hubbie.on('peer', async (eventObj) => {
    // FIXME: these same two SQL queries are repeated in the message event
    const users = await db.runSql('SELECT * FROM users WHERE name = $1', [eventObj.userName]);
    if (users === null || users.length === 0) {
      // console.log('verdict 1  false!');
      return false;
    }
    // console.log('still here 1');
    const user = users[0];
    const contacts = await db.runSql('SELECT * FROM contacts WHERE name = $1 AND user_id  = $2', [eventObj.peerName, user.id]);
    if (contacts === null || contacts.length === 0) {
      // console.log('verdict 2 true!');
      await db.runSql('INSERT INTO contacts (user_id, name, token, landmark) VALUES ($1, $2, $3, $4)', [user.id, eventObj.peerName, eventObj.peerSecret, `${user.name}:${eventObj.peerName}`]);
      return true;
    }
    // console.log('still here 2');
    const contact = contacts[0];
    // console.log('contact found!', eventObj, users, contacts);
    return (eventObj.peerSecret === contact.token);
  });
  function hubbieSend(user, contact, obj) {
    // console.log('hubbieSend', user, contact, obj);
    // FIXME: even when using http, maybe this peer should already exist if a message is
    // being received from them?
    const channelName = `${user.name}/${contact.name}`; // match behavior of hubbie's internal channelName function
    hubbie.addClient({
      peerUrl: contact.url,
      /* fixme: hubbie should omit myName before mySecret in outgoing url */
      myName: contact.token,
      peerName: channelName,
    });
    return hubbie.send(contact.name, JSON.stringify(obj), user.name);
  }

  hubbie.on('message', async (peerName, msg, userName) => {
    // FIXME: these same two SQL queries are already done in the peer event
    const users = await db.runSql('SELECT * FROM users WHERE name = $1', [userName]);
    if (users === null || users.length === 0) {
      return false;
    }
    const user = users[0];
    const contacts = await db.runSql('SELECT * FROM contacts WHERE name = $1 AND user_id  = $2', [peerName, user.id]);
    if (contacts === null || contacts.length === 0) {
      return false;
    }
    const contact = contacts[0];
    return snapIn(user, contact, msg, hubbieSend);
  });

  return function handler(req, res) {
    // console.log('hubbie passed req to app\'s own handler', req.method, req.url);
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    async function handleReq() {
      const [, resource, who] = req.url.split('/');
      switch (resource) {
        case 'session':
          try {
            // console.log(req.headers);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            db.checkPass(username, password).then((user) => {
              res.end(JSON.stringify({ username, ok: (user !== false) }));
            });
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'pay':
          try {
            // console.log(req.headers, body);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const user = await db.checkPass(username, password);
            if (user === false) {
              throw new Error('auth fail');
            }
            // console.log('calling snapOut', user, JSON.parse(body));
            const transactionId = await snapOut(user, JSON.parse(body), hubbieSend);
            const response = {
              ok: true,
              transactionId,
              contacts: await getData(user, 'contacts'),
              transactions: await getData(user, 'transactions'),
            };
            res.end(JSON.stringify(response));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'topup':
          try {
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const user = await db.checkPass(username, password);
            if (user === false) {
              throw new Error('auth fail');
            }
            // console.log('callinglop', user, JSON.parse(body));
            const result = await loop(user, JSON.parse(body), hubbieSend);
            res.end(JSON.stringify({ ok: true, result }));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'sendroutes':
          try {
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const user = await db.checkPass(username, password);
            if (user === false) {
              throw new Error('auth fail');
            }
            const result = await routing.sendRoutes(user, JSON.parse(body), hubbieSend);
            res.end(JSON.stringify({ ok: true, result }));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'profile': {
          res.end(friendForm(who));
          break;
        }
        case 'contacts':
        case 'transactions':
          try {
            // console.log(resource, req.headers.authorization, req.method, body);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            // console.log('checkpass', username, password);
            const user = await db.checkPass(username, password);
            // console.log(user_id, req.method);
            if (user === false) {
              throw new Error('auth error');
            }
            if (req.method === 'PUT') {
              // console.log('yes', resource, body);
              const obj = JSON.parse(body);
              // console.log('saving', resource, obj);
              if (resource === 'contacts') {
                const myRemoteName = randomBytes(12).toString('hex');
                const contact = {
                  user_id: user.id,
                  name: obj.name,
                  url: `${obj.url}/${myRemoteName}`,
                  token: randomBytes(12).toString('hex'),
                  landmark: `${username}:${obj.name}`,
                  min: obj.min,
                  max: 0,
                };
                if (who === 'new') {
                  contact.id = await db.getValue('INSERT INTO contacts ("user_id", "name", "url", "token", "min", "max", "landmark") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id AS value;', [contact.user_id, contact.name, contact.url, contact.token, contact.min, contact.max, contact.landmark]);
                } else {
                  contact.id = parseInt(who, 10);
                  await db.runSql('UPDATE contacts SET "name" = $2, "url" =$3, "token" = $4, "min" = $5, "max" = $6, "landmark" = $7 WHERE user_id = $1 AND id = $8;', [contact.user_id, contact.name, contact.url, contact.token, contact.min, contact.max, contact.landmark, contact.id]);
                }
                await hubbieSend(user, contact, {
                  msgType: 'FRIEND-REQUEST',
                  url: `${hubbie.myBaseUrl}/${username}/${obj.name}`,
                  trust: -obj.min,
                  // myName: user.name,
                  token: contact.token,
                });
                await routing.sendRoutesToNewContact(user, contact, hubbieSend);
              }
            }
            if (req.method === 'DELETE' && resource === 'contacts') {
              const contact = {
                id: parseInt(who, 10),
                // no need to instantiate other fields for a delete
              };
              await db.runSql('DELETE FROM contacts WHERE user_id = $1 AND id = $2;', [user.id, contact.id]);
            }
            const data = await getData(user, resource);
            res.end(JSON.stringify({
              ok: true,
              [resource]: data,
            }));
          } catch (e) {
            console.error(e.message); // eslint-disable-line no-console
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        default:
          file.serve(req, res);
      }
    }
    req.on('end', handleReq);
  };
}

module.exports = { makeHandler };
