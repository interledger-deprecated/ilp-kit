const { assert } = require('chai');
const fs = require('fs');
const db = require('../src/db');
const App = require('../src/app');

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) { // eslint-disable-line no-restricted-syntax
    // console.log(line);
    await db.runSql(line); // eslint-disable-line no-await-in-loop
  }
}

describe('Pay', function () {
  before(async function () {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    // await runSqlFile('./drop.sql');
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    await db.runSql('DELETE FROM transactions');
    this.snapSent = [];
    this.hubbie = {
      addClient: () => {
      },
      send: (peerName, msg, userId) => {
        this.snapSent.push({ peerName, msg, userId });
      },
      on: () => {
      },
    };
    this.handler = App.makeHandler(this.hubbie);
    await new Promise(resolve => this.handler({
      headers: {
        authorization: 'Basic bWljaGllbDpxd2Vy',
      },
      url: '/pay',
      method: 'PUT',
      on: (eventName, eventHandler) => {
        if (eventName === 'data') {
          setTimeout(() => eventHandler(JSON.stringify({
            contactName: 'contact-bob',
            amount: 3,
          })), 0);
        } else {
          setTimeout(() => eventHandler(), 0);
        }
      },
    }, {
      end: () => {
        resolve();
      },
    }));
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });

  it('creates a transsaction', async function () {
    const firstTransaction = await db.getObject('SELECT * FROM transactions LIMIT 1');
    assert.deepEqual(firstTransaction, {
      amount: 3,
      contact_id: 3,
      description: null,
      direction: 'OUT',
      id: 3,
      msgid: 1,
      request_json: null,
      requested_at: new Date(firstTransaction.requested_at),
      responded_at: null,
      response_json: null,
      status: 'pending',
      user_id: 1,
    });
  });

  it('sends a snap message', async function () {
    assert.deepEqual(this.snapSent, [{
      peerName: '1:contact-bob',
      msg: '{"msgType":"PROPOSE","msgId":1,"amount":3}',
      userId: undefined,
    }]);
  });
});
