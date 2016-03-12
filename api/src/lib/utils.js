"use strict"

const _ = require('lodash')
const WebFinger = require('webfinger.js')

// TODO implement caching
module.exports = class utils {
  static * parseDestination (destination, ledgerUri) {
    // Ledger account URI
    // TODO Use a better mechanism to check if the destinationAccount is in a different ledger
    if (destination.indexOf('http://') > -1 || destination.indexOf('https://') > -1) {
      // TODO check if it's the current ledger. If yes, it's not an interledger transaction
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

      try {
        const accountUri = yield new Promise(function(resolve, reject){
          webfinger.lookup(destination,
            function(err, res){
              if (err) {
                return reject(err)
              }

              resolve(_.filter(res.object.links, {rel: 'http://webfinger.net/rel/ledgerAccount'})[0].href)
            }
          )
        })

        return {
          type: 'foreign',
          accountUri: accountUri
        }
      }
      // TODO Handle
      catch (e) {

      }
    }

    // Local account
    return {
      type: 'local',
      accountUri: ledgerUri + '/accounts/' + destination
    }
  }
}