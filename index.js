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
          checkPass(username, password).then((user_id) => {
            res.end(JSON.stringify({  username, ok: (user_id !== false) }));
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
}).listen(process.env.PORT || 3000);

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
    console.log('sql results', result, results);
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

runSql('SELECT now();').then(result => {
  console.log({ result });
});
