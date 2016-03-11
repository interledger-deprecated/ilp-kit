"use strict"

const request = require('supertest')
const constitute = require('constitute')
const App = require('../../src/lib/app')
const Ledger = require('../../src/lib/ledger')
const LedgerMock = require('./ledgerMock')

exports.create = function () {
  const container = new constitute.Container()
  container.bindClass(Ledger, LedgerMock)
  const app = container.constitute(App)
  app.db.sync()

  return request.agent(app.app.listen())
}
