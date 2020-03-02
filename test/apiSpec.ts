import fs from 'fs';
import btoa from 'btoa';
import { runSql, getObject, close } from '../src/db';
import { makeHandler } from '../src/app';

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) { // eslint-disable-line no-restricted-syntax
    // console.log(line);
    await runSql(line); // eslint-disable-line no-await-in-loop
  }
}

describe('API Access', function () {
  before(async function () {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    // await runSqlFile('./drop.sql');
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    this.snapSent = [];
    this.hubbie = {
      addClient: () => {
        return undefined;
      },
      send: (peerName, msg, userId) => {
        this.snapSent.push({ peerName, msg, userId });
      },
      on: () => {
        return undefined;
      },
    };
    this.handler = makeHandler(this.hubbie);
  });
  function doLogin(handler, user, pass) {
    const token = btoa(`${user}:${pass}`);
    return new Promise(resolve => handler({
      headers: {
        authorization: `Basic ${token}`,
      },
      url: '/session',
      method: 'GET',
      on: (eventName, eventHandler) => {
        if (eventName === 'end') {
          setTimeout(() => eventHandler(), 0);
        }
      },
    }, {
      end: resolve,
    }));
  }
  describe('New User', function () {
    beforeEach(async function () {
      this.responseBody = await doLogin(this.handler, 'someone', 'bla');
    });
    it('allows access', function () {
      expect(JSON.parse(this.responseBody)).toEqual({
        username: 'someone',
        ok: true,
      });
    });
    it('registers the new user', async function () {
      const newUser = await getObject('SELECT * FROM users WHERE name= $1', ['someone']);
      expect(newUser).toEqual({
        id: 4,
        name: 'someone',
        secrethash: newUser.secrethash,
      });
    });
  });
  describe('Existing User, Correct', function () {
    beforeEach(async function () {
      this.responseBody = await doLogin(this.handler, 'michiel', 'qwer');
    });
    it('allows access', function () {
      expect(JSON.parse(this.responseBody)).toEqual({
        username: 'michiel',
        ok: true,
      });
    });
  });
  describe('Existing User, Wrong', function () {
    beforeEach(async function () {
      this.responseBody = await doLogin(this.handler, 'michiel', 'bla');
    });
    it('denies access', function () {
      expect(JSON.parse(this.responseBody)).toEqual({
        username: 'michiel',
        ok: false,
      });
    });
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  after(async function () {
    await close();
  });
});
