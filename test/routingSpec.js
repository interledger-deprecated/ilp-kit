// const { assert } = require('chai');
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
    process.env.DATABASE_URL = 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
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
        'edward:Micky': 123,
        donald: 8,
      },
      reachableThrough: {
        donald: 8,
      },
    }), 'michiel');
  });

  it('stores the route', async function () {
    const routes = await db.runSql('SELECT * FROM routes');
    console.log(routes);
  });

  it('forwards the route', async function () {
    console.log(this.snapSent);
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });
});
