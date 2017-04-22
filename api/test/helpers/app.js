'use strict'

const request = require('supertest-as-promised')
const constitute = require('constitute')
const App = require('../../src/lib/app')
const Ledger = require('../../src/lib/ledger')
const LedgerMock = require('./ledgerMock')

// set environment variables
process.env.API_RELOAD = 'true'
process.env.API_ADMIN_USER = 'admin'
process.env.API_ADMIN_PASS = 'admin'

const sleep = function (delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

exports.create = function * () {
  const container = new constitute.Container()
  container.bindClass(Ledger, LedgerMock)
  const app = container.constitute(App)

  app.db.sync()
  // DB is unreliable unless you wait a few ticks
  yield sleep(10)

  return Object.assign(request.agent(app.app.listen()), {
    App: {
      User: app.user,
      DB: app.db
    }
  })
}
