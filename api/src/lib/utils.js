"use strict"

const _ = require('lodash')
const WebFinger = require('webfinger.js')

const Config = require('./config')
const Ledger = require('./ledger')

// TODO implement caching
module.exports = class Utils {
  static constitute () { return [ Config, Ledger ] }
  constructor (config, ledger) {
    this.config = config.data
    this.ledger = ledger
    this.ledgerUri = this.config.getIn(['ledger', 'uri'])
    this.ledgerUriPublic = this.config.getIn(['ledger', 'public_uri'])
  }

  * parseDestination (options) {
    let self = this

    let destination = options.destination
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

      let data

      try {
        data = yield new Promise(function(resolve, reject){
          webfinger.lookup(destination,
            function(err, res){
              if (err) {
                return reject(err)
              }

              resolve(res.object)
            }
          )
        })
      } catch(e) {
        // TODO handle
      }

      let parsedDestination = {
        type: 'foreign',
        accountUri: _.filter(data.links, {rel: 'http://webfinger.net/rel/ledgerAccount'})[0].href,
        ledgerUri: _.filter(data.links, {rel: 'http://webfinger.net/rel/ledgerUri'})[0].href
      }

      if (retrieveLedgerInfo) {
        try {
          parsedDestination.ledgerInfo = yield self.ledger.getInfo(parsedDestination.ledgerUri)
        } catch(e) {
          // TODO handle
        }

        parsedDestination.ledgerInfo = parsedDestination.ledgerInfo.body
      }

      return parsedDestination
    }

    else {
      // Local account
      let parsedDestination = {
        type: 'local',
        accountUri: self.ledgerUriPublic + '/accounts/' + destination,
        ledgerUri: self.ledgerUriPublic
      }

      // TODO api should already know the current ledgerInfo at this point
      if (retrieveLedgerInfo) {
        try {
          parsedDestination.ledgerInfo = yield self.ledger.getInfo(parsedDestination.ledgerUri)
        } catch(e) {
          // TODO handle
        }

        parsedDestination.ledgerInfo = parsedDestination.ledgerInfo.body
      }

      return parsedDestination
    }
  }
}
