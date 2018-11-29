const { assert } = require('chai');
const fs = require('fs');
const Hubbie =  require('hubbie');
const db = require('../src/db');
const App =  require('../src/app');

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) {
    // console.log(line);
    await db.runSql(line);
  }
}

describe('Pay', function () {
  before(async function () {
    process.env.DATABASE_URL = 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./drop.sql');
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    await db.runSql('DELETE FROM transactions');
    this.hubbie = new Hubbie();
    App.initApp(this.hubbie);
    this.handler = App.makeHandler(this.hubbie);
    await new Promise(resolve => this.handler({
      headers: {
        authorization: 'Basic bWljaGllbDpxd2Vy'
      },
      url: '/pay',
      method: 'POST',
      on: (eventName, eventHandler) => {
        if (eventName  == 'data') {
          setTimeout(() => eventHandler(JSON.stringify({
            contactName: 'Eddie',
            amount: 3
          })), 0);
        } else {
          setTimeout(() => eventHandler(), 0);
        }
      },
    }, {
      end: (response) => {
        resolve();
      }
    }));
  });

  afterEach(async function () {
    // await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });

  it('pays a contact', async function () {
    const firstTransaction = await db.getObject('SELECT * FROM transactions LIMIT 1');
     assert.deepEqual(firstTransaction, {
       "amount": 3,
       "contact_id": 1,
       "description": null,
       "direction": "OUT",
       "id": 3,
       "msgid": 1,
       "request_json": null,
       "requested_at": new Date(firstTransaction.requested_at),
       "responded_at": null,
       "response_json": null,
       "status": "pending",
       "user_id": 1,
    });
  });
});
