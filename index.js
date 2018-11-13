const static = require('node-static');
const bcrypt = require('bcrypt');
const atob = require('atob');
const { Pool } = require('pg');
let pool;
if (typeof process.env.DATABASE_URL == 'string') {
  pool = new Pool({
  connectionString: process.env.DATABASE_URL,
    ssl: true
  });
}

let data = {
  contacts: [ {
    name: 'Edward',
    url: 'https://ledgerloops-testnet-1.herokuapp.com/snap/edward',
    token: '45yga3iuhewp3oi3w4j',
    min: -5,
    payable: 0,
    current: 2,
    receivable: 5,
    max: 10
  } ],
  transactions: [ {
    date: '12-11-2018',
    description: 'Beers after squash game',
    direction: 'IN',
    amount: 25
  } ]
};

const file = new static.Server('./public');
 
require('http').createServer(function (req, res) {
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
          checkPass(username, password).then((ok) => {
            res.end(JSON.stringify({  username, ok }));
          });
        } catch(e) {
          res.end(JSON.stringify({  ok: false, error: e.message }));
        }
        break;
      };
      case 'contacts':
      case 'transactions': {
        try {
          console.log(resource, req.headers.authorization, req.method, body);
          const [ username, password ] = atob(req.headers.authorization.split(' ')[1]).split(':');
          checkPass(username, password).then((ok) => {
            if (req.method == 'POST' && !isNaN(index)) {
              const obj = JSON.parse(body);
              console.log('saving', resource, index, obj);
              data[resource][index] = obj;
            }
            res.end(JSON.stringify({
              ok: true,
              [resource]: data[resource]
            }));
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
}).listen(process.env.PORT || 3000);

async function runSql(query, params) {
  if (!pool) {
    return null;
  }
  console.log('running sql', query, params);
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    const results = (result && result.rowCount) ? result.rows : null;
    console.log('sql results', result, results);
    client.release();
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
function checkPass(username, password)  {
  return runSql('SELECT secretHash FROM users WHERE name=$1', [
    username
  ]).then(results => {
    console.log('sql query result', results);
    if (results == null) {
      console.log('registering!', username);
      return bcrypt.hash(password, 10).then((hash) => {
        console.log({ hash });
        return runSql('INSERT INTO users (name, secretHash) VALUES ($1, $2)', [
          username,
          hash
        ]);
      }).then(() => {
        console.log('returning true');
        return true;
      });
    } else {
      const secretHash = results[0].secrethash;
      console.log('returning compare', results, password, secretHash);
      return bcrypt.compare(password, secretHash).then(ret => {
        console.log({  ret });
        return ret;
      });
    }
  });
}

runSql('SELECT now();').then(result => {
  console.log({ result });
});
