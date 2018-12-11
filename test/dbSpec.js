const { assert } = require('chai');
const fs = require('fs');
const db = require('../src/db');

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) { // eslint-disable-line no-restricted-syntax
    // console.log(line);
    await db.runSql(line); // eslint-disable-line no-await-in-loop
  }
}

describe('Database', function () {
  before(async function () {
    process.env.DATABASE_URL = 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });

  it('has a users table', async function () {
    const firstUser = await db.getObject('SELECT * FROM users LIMIT 1');
    assert.deepEqual(firstUser, {
      id: 1,
      name: 'michiel',
      secrethash: '$2b$10$tmznzb0z6FTgb4RNRd5NYOp1WR2SHYvnZuDzawF6BHZPNygsFZ8me',
    });
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
      landmark: 'michiel:edward',
    });
  });

  it('has a transactions table', async function () {
    const firstTransaction = await db.getObject('SELECT * FROM transactions LIMIT 1');
    assert.deepEqual(firstTransaction, {
      amount: 25,
      contact_id: 1,
      description: 'Beers after squash game',
      direction: 'OUT',
      id: 1,
      msgid: null,
      request_json: null,
      requested_at: new Date('2018-11-11T23:00:00.000Z'),
      responded_at: null,
      response_json: null,
      status: null,
      user_id: 1,
    });
  });

  it('has a preimages table', async function () {
    const firstPreimage = await db.getObject('SELECT * FROM preimages LIMIT 1');
    assert.deepEqual(firstPreimage, {
      hash: 'bc21571c5f1968c083c5740bb0879bde3f61c787e3c41540cd3290604f70bbed',
      preimage: '36d0589ec033779c31b50a8cff4aeeacaece3c0ecfe0d8a300b307fd29cf59a3',
      user_id: 3,
    });
  });

  it('has a forwards table', async function () {
    const firstForward = await db.getObject('SELECT * FROM forwards LIMIT 1');
    assert.deepEqual(firstForward, {
      hash: 'asdf',
      incoming_msg_id: 1,
      incoming_peer_id: 1,
      outgoing_peer_id: 2,
      user_id: 1,
    });
  });

  it('has a routes table', async function () {
    const firstRoute = await db.getObject('SELECT * FROM routes LIMIT 1');
    assert.deepEqual(firstRoute, {
      max_to: 8,
      max_from: 51,
      contact_id: 1,
      landmark: 'asdf',
      approach: 'qwer',
      user_id: 1,
    });
  });
});
