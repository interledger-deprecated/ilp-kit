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

describe('Routing', function () {
  before(async function () {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    // console.log(await  db.runSql('SELECT * FROM contacts'));
    this.hubbieHandler = {};
    this.hubbie = {
      addClient: () => {
      },
      send: (peerName, msg, userId) => {
        this.snapSent.push({ peerName, msg, userId });
      },
      on: (eventName, eventHandler) => {
        this.hubbieHandler[eventName] = eventHandler;
      },
    };
    this.snapSent = [];
    this.handler = App.makeHandler(this.hubbie);
    // console.log('calling this handler');
    return this.hubbieHandler.message('Eddie', JSON.stringify({
      msgType: 'ROUTING',
      canRoute: {
        'edward:Micky': {
          maxTo: null,
          maxFrom: null,
        },
        'donald:Ed': {
          maxTo: 51,
          maxFrom: 52,
        },
      },
    }), 'michiel');
  });

  it('stores the route', async function () {
    const routes = await db.runSql('SELECT * FROM routes');
    // console.log(routes);
    assert.deepEqual(routes, [
      {
        user_id: 1,
        contact_id: 1,
        landmark: 'landmark',
        approach: 'qwer',
        max_to: 8,
        max_from: 51,
      },
      {
        user_id: 1,
        contact_id: 1,
        landmark: 'edward',
        approach: 'Micky',
        max_to: null,
        max_from: null,
      },
      {
        user_id: 1,
        contact_id: 1,
        landmark: 'donald',
        approach: 'Ed',
        max_to: 51,
        max_from: 52,
      },
    ]);
  });

  it('forwards the route', async function () {
    assert.deepEqual(this.snapSent, [
      {
        peerName: 'Donnie',
        msg: JSON.stringify({
          msgType: 'ROUTING',
          canRoute: {
            'edward:Micky': {
              maxTo: 1000,
              maxFrom: 10,
            },
            'donald:Ed': {
              maxTo: 51,
              maxFrom: 10,
            },
          },
        }),
        userId: 'michiel',
      },
      {
        peerName: 'contact-bob',
        msg: JSON.stringify({
          msgType: 'ROUTING',
          canRoute: {
            'edward:Micky': {
              maxTo: 1000,
              maxFrom: 10,
            },
            'donald:Ed': {
              maxTo: 51,
              maxFrom: 10,
            },
          },
        }),
        userId: 'michiel',
      },
    ]);
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });
});
