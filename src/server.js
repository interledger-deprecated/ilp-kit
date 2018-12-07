const Hubbie = require('hubbie');
const App = require('./app');
const db = require('./db');

const hubbie = new Hubbie();
const port = parseInt(process.env.PORT || 3000, 10);
console.log('binding to port', port); // eslint-disable-line no-console

hubbie.listen({
  port,
  multiUser: true,
  handler: App.makeHandler(hubbie),
});
db.runSql('SELECT now();'); // test db connection
