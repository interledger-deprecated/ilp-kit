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
    // console.log(routes);
    assert.deepEqual(routes, [
      {
        user_id: 1,
        contact_id: 1,
        landmark: 'asdf',
        approach: 'qwer',
        max_to: 8,
        max_from: 51,
      },
    ]);
  });

  it('forwards the route', async function () {
    assert.deepEqual(this.snapSent, [
      {
        peerName: 'Eddie',
        msg: '{"msgType":"ROUTING","canRoute":{"michiel:edward":{"max_to":1000,"max_from":10}}}',
        userId: 'michiel',
      },
      {
        peerName: 'Donnie',
        msg: '{"msgType":"ROUTING","canRoute":{"michiel:donald":{"max_to":1000,"max_from":10},"asdf":{"max_to":8,"max_from":10}}}',
        userId: 'michiel',
      },
      {
        peerName: 'contact-bob',
        msg: '{"msgType":"ROUTING","canRoute":{"landmark":{"max_to":1000,"max_from":10},"asdf":{"max_to":8,"max_from":10}}}',
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
