'use strict'

const _ = require('lodash')
const WebFinger = require('webfinger.js')
const currencySymbolMap = require('currency-symbol-map').currencySymbolMap
const superagent = require('superagent')

const Config = require('./config')
const Ledger = require('./ledger')

const NotFoundError = require('../errors/not-found-error')

// TODO implement caching
module.exports = class Utils {
  constructor (deps) {
    const config = this.config = deps(Config)
    this.ledger = deps(Ledger)
    this.ledgerUriPublic = config.data.getIn(['ledger', 'public_uri'])
    this.ledgerPrefix = config.data.getIn(['ledger', 'prefix'])
    this.localUri = config.data.getIn(['server', 'base_uri'])
    this.localHost = config.data.getIn(['server', 'base_host'])
  }

  resolveSpspIdentifier (identifier) {
    const [ username, domain ] = identifier.split('@')
    if (domain !== this.localHost) return identifier
    return this.localUri + '/spsp/' + username
  }

  isWebfinger (destination) {
    // TODO better email style checking
    return destination.search('@') > -1
  }

  userToImageUrl (user) {
    return (this.config.data.getIn(['server', 'base_uri']) + '/users/' +
      user.username + '/profilepic')
  }

  async _webfingerLookup (resource) {
    const webfinger = new WebFinger({
      webfist_fallback: false,
      tls_only: true,
      uri_fallback: false,
      request_timeout: 3000
    })

    return new Promise((resolve, reject) => {
      webfinger.lookup(resource, (err, res) => err ? reject(err) : resolve(res.object))
    })
  }

  async getWebfingerAccount (address) {
    try {
      const response = await this._webfingerLookup(address)

      return {
        ledgerUri: _.filter(response.links, {rel: 'https://interledger.org/rel/ledgerUri'})[0].href,
        paymentUri: _.filter(response.links, {rel: 'https://interledger.org/rel/spsp/v2'})[0].href,
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
  async parseDestination (options) {
    const self = this

    const destination = options.destination

    let ledgerUri
    let paymentUri
    let ilpAddress
    let ledgerInfo = {}
    let receiverInfo = {}

    if (self.isWebfinger(destination)) {
      // Webfinger lookup
      const account = await self.getWebfingerAccount(destination)

      ledgerUri = account.ledgerUri
      paymentUri = account.paymentUri
      ilpAddress = account.ilpAddress
    } else {
      // Local account
      ledgerUri = self.ledgerUriPublic
      paymentUri = self.localUri + '/spsp/' + destination
      ilpAddress = self.ledgerPrefix + destination
    }

    // Get SPSP receiver info
    let spspResponse
    try {
      spspResponse = (await superagent.get(paymentUri)).body

      ledgerInfo = spspResponse.ledger_info
      receiverInfo = spspResponse.receiver_info
    } catch (e) {
      throw new NotFoundError('Unknown spsp receiver')
    }

    return {
      ledgerUri,
      paymentUri,
      ilpAddress,
      identifier: self.isWebfinger(destination) ? destination : this.getWebfingerAddress(destination),
      currencyCode: ledgerInfo.currency_code,
      currencySymbol: currencySymbolMap[ledgerInfo.currency_code],
      name: receiverInfo.name,
      imageUrl: receiverInfo.image_url
    }
  }

  getWebfingerAddress (username) {
    return username + '@' + this.localHost
  }

  async hostLookup (host) {
    let response
    try {
      response = await this._webfingerLookup(host)
    } catch (e) {
      throw new NotFoundError('Host is unavailable')
    }

    if (!response) throw new NotFoundError('Host is unavailable')
    if (!response.properties) throw new NotFoundError("Host doesn't have an ilp-kit or the version is not compatible")

    try {
      return {
        publicKey: response.properties['https://interledger.org/rel/publicKey'],
        peersRpcUri: _.filter(response.links, {rel: 'https://interledger.org/rel/peersRpcUri'})[0].href
      }
    } catch (e) {
      throw new NotFoundError('Host webfinger parsing failed')
    }
  }
}
