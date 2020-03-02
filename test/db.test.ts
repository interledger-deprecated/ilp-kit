import fs from 'fs';
import { runSql, getObject, close } from '../src/db';

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) { // eslint-disable-line no-restricted-syntax
    // console.log(line);
    await runSql(line); // eslint-disable-line no-await-in-loop
  }
}

describe('Database', function () {
  beforeAll(() => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  afterAll(async function () {
    await close();
  });

  it('has a users table', async function () {
    const firstUser = await getObject('SELECT * FROM users LIMIT 1');
    expect(firstUser).toEqual({
      id: 1,
      name: 'michiel',
      secrethash: '$2b$10$tmznzb0z6FTgb4RNRd5NYOp1WR2SHYvnZuDzawF6BHZPNygsFZ8me',
    });
  });

  it('has a contacts table', async function () {
    const firstContact = await getObject('SELECT * FROM contacts LIMIT 1');
    expect(firstContact).toEqual({
      id: 1,
      userId: 1,
      name: 'Eddie',
      url: 'http://localhost:3000/edward/Micky',
      token: '45yga3iuhewp3oi3w4j',
      min: -10,
      max: 1000,
      landmark: 'michiel:edward',
    });
  });

  it('has a transactions table', async function () {
    const firstTransaction = await getObject('SELECT * FROM transactions LIMIT 1');
    expect(firstTransaction).toEqual({
      amount: 25,
      contactId: 1,
      description: 'Beers after squash game',
      direction: 'OUT',
      id: 1,
      msgid: null,
      requestJson: null,
      requestedAt: firstTransaction.requestedAt, // new Date('2018-12-11T00:00:00.000Z'), - see https://github.com/ledgerloops/nlt-kit/issues/38
      respondedAt: null,
      responseJson: null,
      status: null,
      userId: 1,
    });
  });

  it('has a preimages table', async function () {
    const firstPreimage = await getObject('SELECT * FROM preimages LIMIT 1');
    expect(firstPreimage).toEqual({
      hash: 'bc21571c5f1968c083c5740bb0879bde3f61c787e3c41540cd3290604f70bbed',
      preimage: '36d0589ec033779c31b50a8cff4aeeacaece3c0ecfe0d8a300b307fd29cf59a3',
      userId: 3,
    });
  });

  it('has a forwards table', async function () {
    const firstForward = await getObject('SELECT * FROM forwards LIMIT 1');
    expect(firstForward).toEqual({
      hash: 'asdf',
      incomingMsgId: 1,
      incomingPeerId: 1,
      outgoingPeerId: 2,
      userId: 1,
    });
  });

  it('has a routes table', async function () {
    const firstRoute = await getObject('SELECT * FROM routes LIMIT 1');
    expect(firstRoute).toEqual({
      maxTo: 8,
      maxFrom: 51,
      contactId: 1,
      landmark: 'landmark',
      approach: 'qwer',
      userId: 1,
    });
  });
});
