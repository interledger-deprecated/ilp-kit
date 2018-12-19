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

describe('SNAP Access', function () {
  before(async function () {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    // await runSqlFile('./drop.sql');
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    this.snapSent = [];
    this.hubbieHandlers = {};
    this.hubbie = {
      addClient: () => {
      },
      send: (peerName, msg, userId) => {
        this.snapSent.push({ peerName, msg, userId });
      },
      on: (eventName, handler) => {
        this.hubbieHandlers[eventName] = handler;
      },
    };
    this.handler = App.makeHandler(this.hubbie);
  });
  describe('valid contact', function () {
    beforeEach(async function () {
      this.verdict = await this.hubbieHandlers.peer({
        userName: 'michiel',
        peerName: 'contact-bob',
        peerSecret: 'some_token',
      });
      return this.hubbieHandlers.message('contact-bob', '{}', 'michiel');
    });
    it('returns true to the Hubbie peer event', function () {
      assert.equal(this.verdict, true);
    });
  });

  describe('unknown contact', function () {
    beforeEach(async function () {
      this.verdict = await this.hubbieHandlers.peer({
        userName: 'michiel',
        peerName: 'someone-unknown',
        peerSecret: 'what',
      });
      return this.hubbieHandlers.message('contact-bob', '{}', 'michiel');
    });
    it('returns false to the Hubbie peer event', function () {
      assert.equal(this.verdict, false);
    });
  });

  describe('wrong token', function () {
    beforeEach(async function () {
      this.verdict = await this.hubbieHandlers.peer({
        userName: 'michiel',
        peerName: 'contact-bob',
        peerSecret: 'wrong',
      });
      return this.hubbieHandlers.message('contact-bob', '{}', 'michiel');
    });
    it('returns false to the Hubbie peer event', function () {
      assert.equal(this.verdict, false);
    });
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await db.close();
  });
});
