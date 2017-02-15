'use strict'

const _ = require('lodash')
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
    this.ledgerPrefix = config.data.getIn(['ledger', 'prefix'])
    this.localUri = config.data.getIn(['server', 'base_uri'])
    this.localHost = config.data.getIn(['server', 'base_host'])
  }

  isWebfinger (destination) {
    // TODO better email style checking
    return destination.search('@') > -1
  }

  * webfingerLookup (resource) {
    const webfinger = new WebFinger({
      webfist_fallback: false,
      tls_only: true,
      uri_fallback: false,
      request_timeout: 3000
    })

    return (yield new Promise((resolve, reject) => {
      webfinger.lookup(resource, (err, res) => err ? reject(err) : resolve(res.object))
    }))
  }

  * getWebfingerAccount (address) {
    try {
      const response = yield this.webfingerLookup(address)

      return {
        ledgerUri: _.filter(response.links, {rel: 'https://interledger.org/rel/ledgerUri'})[0].href,
        paymentUri: _.filter(response.links, {rel: 'https://interledger.org/rel/receiver'})[0].href,
        ilpAddress: _.filter(response.links, {rel: 'https://interledger.org/rel/ilpAddress'})[0].href
      }
    } catch (e) {
      throw new NotFoundError('Unknown account')
    }
  }

  /**
   * options
   *  - destination - string (username or webfinger)
   */
  * parseDestination (options) {
    const self = this

    const destination = options.destination

    let ledgerUri
    let paymentUri
    let ilpAddress

    if (self.isWebfinger(destination)) {
      // Webfinger lookup
      const account = yield self.getWebfingerAccount(destination)

      ledgerUri = account.ledgerUri
      paymentUri = account.paymentUri
      ilpAddress = account.ilpAddress
    } else {
      // Local account
      ledgerUri = self.ledgerUriPublic
      paymentUri = self.localUri + '/receivers/' + destination
      ilpAddress = self.ledgerPrefix + destination
    }

    // Get SPSP receiver info
    let receiver
    try {
      receiver = (yield superagent.get(paymentUri).end()).body
    } catch (e) {
      throw new NotFoundError('Unknown receiver')
    }

    return {
      ledgerUri: ledgerUri,
      paymentUri: paymentUri,
      ilpAddress: ilpAddress,
      identifier: self.isWebfinger(destination) ? destination : this.getWebfingerAddress(destination),
      currencyCode: receiver.currency_code,
      currencySymbol: receiver.currency_symbol,
      name: receiver.name,
      imageUrl: receiver.image_url
    }
  }

  getWebfingerAddress (username) {
    return username + '@' + this.localHost
  }

  * hostLookup (host) {
    let response
    try {
      response = yield this.webfingerLookup(host)
    } catch (e) {
      throw new NotFoundError('Host is unavailable')
    }

    if (!response) throw new NotFoundError('Host is unavailable')
    if (!response.properties) throw new NotFoundError("Host doesn't have an ilp-kit or the version is not compatible")

    return {
      publicKey: response.properties['https://interledger.org/rel/publicKey'],
      peersRpcUri: _.filter(response.links, {rel: 'https://interledger.org/rel/peersRpcUri'})[0].href
    }
  }
}
