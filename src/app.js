/* eslint-disable camelcase */
const Static = require('node-static');
const atob = require('atob');
const { runSql, checkPass } = require('./db');
const { snapOut, snapIn } = require('./snap');
const { loop } = require('./loops');
const routing = require('./routing');
const balances = require('./balances');

const file = new Static.Server('./public');

function mixInBalances(contacts) {
  async function addBalances(contact) {
    return Object.assign(contact, {
      payable: await balances.getTheirPayable(contact.user_id, contact.id),
      receivable: await balances.getTheirReceivable(contact.user_id, contact.id),
      current: await balances.getTheirCurrent(contact.user_id, contact.id),
    });
  }
  return Promise.all(contacts.map(addBalances));
}

function getData(user_id, resource) {
  const columns = {
    contacts: '"id", "user_id", "name", "url", "token", "min", "max"',
    transactions: '"user_id", "requested_at", "description", "direction", "amount"',
  };
  return runSql(`SELECT ${columns[resource]} FROM ${resource} WHERE user_id = $1;`, [user_id]).then((data) => {
    if (resource === 'contacts') {
      return mixInBalances(data);
    }
    return data;
  });
}

function makeHandler(hubbie) {
  return function handler(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    async function handleReq() {
      const [, resource, index] = req.url.split('/');
      switch (resource) {
        case 'session':
          try {
            // console.log(req.headers);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            checkPass(username, password).then((user_id) => {
              res.end(JSON.stringify({ username, ok: (user_id !== false) }));
            });
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'pay':
          try {
            // console.log(req.headers, body);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const userId = checkPass(username, password);
            if (userId === false) {
              throw new Error('auth fail');
            }
            const transactionId = await snapOut(userId, JSON.parse(body), hubbie);
            const response = {
              ok: true,
              transactionId,
              contacts: await getData(userId, 'contacts'),
              transactions: await getData(userId, 'transactions'),
            };
            res.end(JSON.stringify(response));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'topup':
          try {
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const userId = await checkPass(username, password);
            if (userId === false) {
              throw new Error('auth fail');
            }
            const result = await loop(userId, JSON.parse(body), hubbie);
            res.end(JSON.stringify({ ok: true, result }));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'sendroutes':
          try {
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            const userId = await checkPass(username, password);
            if (userId === false) {
              throw new Error('auth fail');
            }
            const result = await routing.sendRoutes(userId, JSON.parse(body), hubbie);
            res.end(JSON.stringify({ ok: true, result }));
          } catch (e) {
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
          break;
        case 'contacts':
        case 'transactions':
          try {
            // console.log(resource, req.headers.authorization, req.method, body);
            const [username, password] = atob(req.headers.authorization.split(' ')[1]).split(':');
            checkPass(username, password).then((user_id) => {
              if (user_id === false) {
                throw new Error('auth error');
              }
              if (req.method === 'POST' && !Number.isNaN(index)) {
                const obj = JSON.parse(body);
                // console.log('saving', resource, index, obj);
                if (resource === 'contacts') {
                  runSql('INSERT INTO contacts ("user_id", "name", "url", "token", "min", "max") VALUES ($1, $2, $3, $4, $5, $6);', [user_id, obj.name, obj.url, obj.token, obj.min, obj.max]);
                }
              }
              getData(user_id, resource).then((data) => {
                res.end(JSON.stringify({
                  ok: true,
                  [resource]: data,
                }));
              });
            });
          } catch (e) {
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

function initApp(hubbie) {
  hubbie.on('peer', eventObj => runSql(
    'select c.token from users u join contacts c on u.id=c.user_id where u.name= $1 and c.name= $2', [
      eventObj.userName,
      eventObj.peerName,
    ], // I think requiring this trailing comma is a bug in eslint
  ).then(results => results && results.length && eventObj.peerSecret === results[0].token));

  hubbie.on('message', (peerName, msg, userName) => snapIn(peerName, msg, userName, hubbie));
}
module.exports = { makeHandler, initApp };
