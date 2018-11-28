const Hubbie =  require('hubbie');
const static = require('node-static');
const atob = require('atob');
const  { runSql, checkPass } = require('./db');
const  { snapOut, snapIn } = require('./snap');
const  { loop } = require('./loops');
const routing = require('./routing');
const balances = require('./balances');

const file = new static.Server('./public');

async function mixInBalances(contacts) {
  for (let i=0; i<contacts.length; i++) {
    console.log(contacts[i]);
    contacts[i].payable = await balances.getTheirPayable(contacts[i].user_id, contacts[i].id);
    contacts[i].receivable = await balances.getTheirReceivable(contacts[i].user_id, contacts[i].id);
    contacts[i].current =  await balances.getTheirCurrent(contacts[i].user_id, contacts[i].id);
  }
  return contacts;
}
function getData(user_id, resource) {
  const columns  = {
    contacts: '"id", "user_id", "name", "url", "token", "min", "max"',
    transactions: '"user_id", "requested_at", "description", "direction", "amount"'
  };
  return runSql(`SELECT ${columns[resource]} FROM ${resource} WHERE user_id = $1;`, [ user_id ]).then(data => {
    if (resource  == 'contacts') {
      return mixInBalances(data);
    }
    return data;
  });
}

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
          console.log(req.headers, body);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          return checkPass(username, password);
        }).then(async function (userId) {
          if (userId === false) {
            throw new Error('auth fail');
          }
          const transactionId = await snapOut(userId, JSON.parse(body), hubbie);
          res.end(JSON.stringify({
            ok: true,
            transactionId,
            contacts: await getData(userId, 'contacts'),
            transactions: await getData(userId, 'transactions')
          }));
        }).catch((e) => {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        });
        break;
      };
      case 'topup': {
        Promise.resolve().then(() => {
          console.log(req.headers, body);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          return checkPass(username, password);
        }).then((userId) => {
          if (userId === false) {
            throw new Error('auth fail');
          }
          return loop(userId, JSON.parse(body), hubbie);
        }).then((result) => {
          res.end(JSON.stringify({ ok: true, result }));
        }).catch((e) => {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        });
        break;
      };
      case 'sendroutes': {
        Promise.resolve().then(() => {
          console.log(req.headers, body);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          return checkPass(username, password);
        }).then((userId) => {
          if (userId === false) {
            throw new Error('auth fail');
          }
          return routing.sendRoutes(userId, JSON.parse(body), hubbie);
        }).then((result) => {
          res.end(JSON.stringify({ ok:true, result }));
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
                runSql('INSERT INTO contacts ("user_id", "name", "url", "token", "min", "max") VALUES ($1, $2, $3, $4, $5, $6);', [user_id, obj.name, obj.url, obj.token, obj.min, obj.max ]);
              }
              if (resource == 'transactions') {
                runSql('INSERT INTO transactions ("user_id", "requested_at", "description", "direction", "amount") VALUES ($1, $2, $3, $4, $5);', [user_id, obj.date, obj.description, obj.direction, obj.amount]);
              }
            }
            getData(user_id, resource).then(data => {
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

hubbie.on('peer', (eventObj) => {
  console.log('hubbie peer!', eventObj);
  return runSql('select c.token from users u join contacts c on u.id=c.user_id where u.name= $1 and c.name= $2', [
    eventObj.userName,
    eventObj.peerName,
  ]).then(results => {
    return results && results.length && eventObj.peerSecret == results[0].token;
  });
});

hubbie.on('message', (peerName, msg, userName) => {
  return snapIn(peerName, msg, userName, hubbie);
});

hubbie.listen({
  port: process.env.PORT || 3000,
  multiUser: true,
  handler
});
runSql('SELECT now();').then(result => {
  console.log({ result });
});
