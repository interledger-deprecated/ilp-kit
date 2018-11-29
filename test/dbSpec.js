const { assert } = require('chai');
const fs = require('fs');
const db = require('../src/db');

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) {
    console.log(line);
    await db.runSql(line);
  }
}

describe('App', function () {
  beforeEach(async function () {
    process.env.DATABASE_URL = 'postgresql://snap:snap@localhost/test';
    await runSqlFile('./drop.sql');
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
  });

  afterEach(async function () {
//    await runSqlFile('./drop.sql');
  });

  it('has a contacts table', async function () {
    const firstContact = await db.getObject('SELECT * FROM contacts LIMIT 1');
    assert.deepEqual(firstContact, {
      id: 1,
      user_id: 1,
      name: 'Eddie',
      url: 'http://localhost:3000/edward/Micky',
      token: '45yga3iuhewp3oi3w4j',
      min: -10,
      max: 1000,
      landmark: 'michiel:edward'
    });
  });
});
