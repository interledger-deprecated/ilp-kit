'use strict'

const exampleLedgerData = require('../data/ledger')

module.exports = class LedgerMock {
  async createAccount (user) {
    return exampleLedgerData.accounts[user.username]
  }

  async updateAccount (user) {
    return Object.assign(exampleLedgerData.accounts[user.username], user)
  }

  async getAccount (user) {
    return exampleLedgerData.accounts[user.username]
  }

  async subscribe () {}
}
