"use strict"

const _ = require('lodash')
const WebFinger = require('webfinger.js')
const superagent = require('superagent-promise')(require('superagent'), Promise)

// TODO implement caching
// TODO turn into a service
module.exports = class utils {
  static * parseDestination (options) {
    let destination = options.destination
    let currentLedgerUri = options.currentLedgerUri
    let retrieveLedgerInfo = options.retrieveLedgerInfo

    // Ledger account URI
    // TODO Use a better mechanism to check if the destinationAccount is in a different ledger
    if (destination.indexOf('http://') > -1 || destination.indexOf('https://') > -1) {
      // TODO check if it's the current ledger. If yes, it's not an interledger transaction
      // TODO should also parse the ledger info here
      // TODO should also retrieve ledger info here
      return {
        type: 'foreign',
        accountUri: destination
      }
    }

    // Webfinger
    // TODO better email style checking
    else if (destination.search('@') > -1) {
      var webfinger = new WebFinger({
        webfist_fallback: true,
        tls_only: true,
        uri_fallback: false,
        request_timeout: 10000
      });

      const data = yield new Promise(function(resolve, reject){
        webfinger.lookup(destination,
          function(err, res){
            if (err) {
              return reject(err)
            }

            resolve(res.object)
          }
        )
      })

      let parsedDestination = {
        type: 'foreign',
        accountUri: _.filter(data.links, {rel: 'http://webfinger.net/rel/ledgerAccount'})[0].href,
        ledgerUri: _.filter(data.links, {rel: 'http://webfinger.net/rel/ledgerUri'})[0].href
      }

      if (retrieveLedgerInfo) {
        // TODO handle exceptions
        parsedDestination.ledgerInfo = yield superagent
          .get(parsedDestination.ledgerUri)
          .end()
        parsedDestination.ledgerInfo = parsedDestination.ledgerInfo.body
      }

      return parsedDestination
    }

    else {
      // Local account
      let parsedDestination = {
        type: 'local',
        accountUri: currentLedgerUri + '/accounts/' + destination,
        ledgerUri: currentLedgerUri
      }

      // TODO api should already know the current ledgerInfo at this point
      if (retrieveLedgerInfo) {
        parsedDestination.ledgerInfo = yield superagent
          .get(parsedDestination.ledgerUri)
          .end()
        parsedDestination.ledgerInfo = parsedDestination.ledgerInfo.body
      }

      return parsedDestination
    }
  }
}