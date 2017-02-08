"use strict"

const _ = require('lodash')
const url = require('url')
const WebFinger = require('webfinger.js')
const superagent = require('superagent-promise')(require('superagent'), Promise)

const Config = require('./config')
const Ledger = require('./ledger')

const NotFoundError = require('../errors/not-found-error')

// TODO implement caching
module.exports = class Utils {
  static constitute() { return [ Config, Ledger ] }
  constructor(config, ledger) {
    this.ledger = ledger
    this.ledgerUriPublic = config.data.getIn(['ledger', 'public_uri'])
    this.ledgerPrefix = config.data.getIn(['ledger', 'prefix'])
    this.localUri = config.data.getIn(['server', 'base_uri'])
    this.localHost = config.data.getIn(['server', 'base_host'])
  }

  * getAccount(accountUri) {
    let response

    try {
      response = yield superagent.get(accountUri).end()
    } catch (e) {
      throw new NotFoundError('Unknown account')
    }

    return response.body
  }

  isWebfinger(destination) {
    // TODO better email style checking
    return destination.search('@') > -1
  }

  * getWebfingerAccount(address) {
    const parsed = url.parse(address)

    const webfinger = new WebFinger({
      webfist_fallback: false,
      tls_only: true,
      uri_fallback: false,
      request_timeout: 5000
    })

    let response

    try {
      response = yield new Promise(function(resolve, reject) {
        webfinger.lookup(address,
          function(err, res) {
            if (err) {
              return reject(err)
            }

            resolve(res.object)
          }
        )
      })
    } catch(e) {
      console.error(e)
      throw new NotFoundError('Unknown account')
    }

    return {
      ledgerUri: _.filter(response.links, {rel: 'https://interledger.org/rel/ledgerUri'})[0].href,
      paymentUri: _.filter(response.links, {rel: 'https://interledger.org/rel/receiver'})[0].href,
      ilpAddress: _.filter(response.links, {rel: 'https://interledger.org/rel/ilpAddress'})[0].href
    }
  }

  /**
   * TODO better docs
   *
   * options
   *  - destination - string (username or webfinger)
   */
  * parseDestination(options) {
    const self = this

    const destination = options.destination

    let ledgerUri
    let paymentUri
    let ilpAddress

    // Webfinger lookup
    if (self.isWebfinger(destination)) {
      const account = yield self.getWebfingerAccount(destination)

      ledgerUri = account.ledgerUri
      paymentUri = account.paymentUri
      ilpAddress = account.ilpAddress
    }

    // Local account
    else {
      ledgerUri = self.ledgerUriPublic
      paymentUri = self.localUri + '/receivers/' + destination
      ilpAddress = self.ledgerPrefix + destination

      // Check if account exists
      yield self.getAccount(self.ledgerUriPublic + '/accounts/' + destination)
    }

    // Get SPSP receiver info
    const receiver = yield self.getAccount(paymentUri)

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
    // TODO:REFACTOR code dup with getWebfingerAccount
    const webfinger = new WebFinger({
      webfist_fallback: false,
      tls_only: true,
      uri_fallback: false,
      request_timeout: 5000
    })

    let response

    try {
      response = yield new Promise(function (resolve, reject) {
        webfinger.lookup(host,
          function (err, res) {
            if (err) {
              return reject(err)
            }

            resolve(res.object)
          }
        )
      })
    } catch (e) {
      console.error(e)
      throw new NotFoundError('Unknown host')
    }

    if (!response) throw new NotFoundError('Unknown host')

    return {
      publicKey: response.properties['https://interledger.org/rel/publicKey'],
      peersRpcUri: _.filter(response.links, {rel: 'https://interledger.org/rel/peersRpcUri'})[0].href
    }
  }
}
