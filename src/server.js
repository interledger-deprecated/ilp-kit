const Hubbie = require('hubbie');
const App = require('./app');

const hubbie = new Hubbie();
const db = require('./db');

App.initApp(hubbie);
hubbie.listen({
  port: process.env.PORT || 3000,
  multiUser: true,
  handler: App.handler,
});
db.runSql('SELECT now();').then((result) => {
  console.log({ result });
});
