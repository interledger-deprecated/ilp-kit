"use strict"

const _ = require('lodash')
const url = require("url")
const WebFinger = require('webfinger.js')
const superagent = require('superagent-promise')(require('superagent'), Promise)

const Config = require('./config')
const Ledger = require('./ledger')

const NotFoundError = require('../errors/not-found-error')

// TODO implement caching
module.exports = class Utils {
  static constitute () { return [ Config, Ledger ] }
  constructor (config, ledger) {
    this.ledger = ledger
    this.ledgerUriPublic = config.data.getIn(['ledger', 'public_uri'])
    this.localUri = config.data.getIn(['server', 'base_uri'])
  }

  isAccountUri (destination) {
    return destination.indexOf('http://') > -1 || destination.indexOf('https://') > -1
  }

  isForeignAccountUri (destination) {
    return this.isAccountUri(destination) && destination.indexOf(this.ledgerUriPublic) === -1
  }

  * getAccount (accountUri) {
    let response

    try {
      response = yield superagent.get(accountUri).end()
    } catch (e) {
      throw new NotFoundError("Unknown account")
    }

    return response.body
  }

  isWebfinger (destination) {
    // TODO better email style checking
    return destination.search('@') > -1
  }

  * getWebfingerAccount (address) {
    let parsed = url.parse(address)

    // This dirty hack will stay here until there's a resolution to
    // https://github.com/silverbucket/webfinger.js/issues/18
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const username = parsed.path.match(/([^\/]*)\/*$/)[1]
      address = username + '@' + parsed.hostname
    }

    const webfinger = new WebFinger({
      webfist_fallback: false,
      tls_only: true,
      uri_fallback: false,
      request_timeout: 5000
    });

    let response

    try {
      response = yield new Promise(function(resolve, reject){
        webfinger.lookup(address,
          function(err, res){
            if (err) {
              return reject(err)
            }

            resolve(res.object)
          }
        )
      })
    } catch(e) {
      throw new NotFoundError("Unknown account")
    }

    return {
      accountUri: _.filter(response.links, {rel: 'https://interledger.org/rel/ledgerAccount'})[0].href,
      ledgerUri: _.filter(response.links, {rel: 'https://interledger.org/rel/ledgerUri'})[0].href,
      paymentUri: _.filter(response.links, {rel: 'https://interledger.org/rel/receiver'})[0].href
    }
  }

  /**
   * TODO better docs
   *
   * options
   *  - destination - string
   *  - retrieveLedgerInfo - bool (retrieves ledger info (currency, api endpoints, etc))
   */
  * parseDestination (options) {
    let self = this

    const destination = options.destination

    let accountUri
    let ledgerUri
    let paymentUri

    // Webfinger lookup
    if (self.isWebfinger(destination) || self.isForeignAccountUri(destination)) {
      const account = yield self.getWebfingerAccount(destination)

      accountUri = account.accountUri
      ledgerUri = account.ledgerUri
      paymentUri = account.paymentUri
    }

    // Local account
    else {
      accountUri = self.isAccountUri(destination) ? destination : self.ledgerUriPublic + '/accounts/' + destination
      ledgerUri = self.ledgerUriPublic
      paymentUri = self.localUri

      // Check if account exists
      yield self.getAccount(accountUri)
    }

    let parsedDestination = {
      type: this.isForeignAccountUri(accountUri) ? 'foreign' : 'local',
      accountUri: accountUri,
      ledgerUri: ledgerUri,
      paymentUri: paymentUri
    }

    // TODO:PERFORMANCE api should already know the current ledgerInfo at this point
    if (options.retrieveLedgerInfo) {
      parsedDestination.ledgerInfo = yield self.ledger.getInfo(parsedDestination.ledgerUri)
    }

    return parsedDestination
  }
}
