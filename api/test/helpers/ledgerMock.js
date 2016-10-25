"use strict"

const exampleLedgerData = require('../data/ledger')

module.exports = class LedgerMock {
  * createAccount(user) {
    return exampleLedgerData.accounts[user.username]
  }

  * updateAccount(user) {
    return Object.assign(exampleLedgerData.accounts[user.username], user)
  }

  * getAccount (user) {
    return exampleLedgerData.accounts[user.username]
  }

  * subscribe () {}
}
