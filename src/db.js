const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/snap',
  ssl: true,
});

async function runSql(query, params) {
  if (!pool) {
    // console.log('ERROR! NO DATABASE CONNECTION!');
    return null;
  }
  // console.log('running sql', query, params);
  try {
    const client = await pool.connect();
    // console.log('query', query, params);
    const result = await client.query(query, params);
    const results = (result && result.rowCount) ? result.rows : null;
    // // console.log('sql results', result, results);
    client.release();
    return results;
  } catch (err) {
    // console.log('DATABASE ERROR!');
    // console.error(err);
    // throw err;
  }
  return undefined; // eslint requires this
}
function checkPass(username, password) {
  // console.log('checking  password', username, password);
  return runSql('SELECT id, secrethash FROM users WHERE name=$1', [
    username,
  ]).then((results) => {
    // console.log('sql query result', results);
    if (results == null) {
      // console.log('registering!', username);
      return bcrypt.hash(password, 10).then(hash => runSql(
        'INSERT INTO users (name, secrethash) VALUES ($1, $2)', [
          username,
          hash,
        ],
      ));
    }
    const secretHash = results[0].secrethash;
    // console.log('returning compare', results, password, secretHash);
    return bcrypt.compare(password, secretHash).then(ret => ret && results[0].id);
  });
}

function getObject(query, params) {
  return runSql(query, params).then((results) => {
    if (!results || !results.length) {
      throw new Error('db row not found');
    }
    return results[0];
  });
}

function getValue(query, params, defaultVal) {
  return getObject(query, params).then(obj => obj.value).catch((e) => {
    if (e.message === 'db row not found' && defaultVal !== undefined) {
      return defaultVal;
    }
    throw e;
  });
}

module.exports = {
  runSql, checkPass, getObject, getValue,
};
