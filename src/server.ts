import { Hubbie } from 'hubbie';
import { makeHandler } from './app';
import { runSql } from './db';

const hubbie = new Hubbie();
const port = parseInt(process.env.PORT || '3000', 10);
hubbie.myBaseUrl = process.env.HOST || `http://localhost:${port}`;
console.log('binding to port', port); // eslint-disable-line no-console

hubbie.listen({
  port,
  multiUser: true,
  handler: makeHandler(hubbie),
});

runSql('SELECT now();', {}); // test db connection