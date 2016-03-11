"use strict"

const exampleLedgerData = require('../data/ledger')

module.exports = class LedgerMock {
  * createAccount(user) {
    return exampleLedgerData.accounts[user.username]
  }

  * getAccount (user) {
    return exampleLedgerData.accounts[user.username]
  }

  * subscribe () {}
}