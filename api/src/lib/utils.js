"use strict"

module.exports = class utils {
  static parseDestination (destination, ledgerUri) {
    // TODO Use a better mechanism to check if the destinationAccount is in a different ledger
    if (destination.indexOf('http://') > -1 || destination.indexOf('https://') > -1) {
      // TODO check if it's the current ledger. If yes, it's not an interledger transaction
      return {
        type: 'foreign',
        accountUri: destination
      }
    }

    // Local account
    return {
      type: 'local',
      accountUri: ledgerUri + '/accounts/' + destination
    }
  }
}