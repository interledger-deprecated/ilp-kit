"use strict"

module.exports = MiscControllerFactory

const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')
const Utils = require('../lib/utils')

MiscControllerFactory.constitute = [Auth, Log, Config, Ledger, Utils]
function MiscControllerFactory (Auth, log, config, ledger, utils) {
  log = log('misc')

  return class MiscController {
    static init (router) {
      router.get('/parse/destination', this.destination)
      router.get('/config', this.config)
    }

    /**
     * @api {GET} /parse/destination Parse destination
     * @apiName ParseDestination
     * @apiGroup Misc
     * @apiVersion 1.0.0
     *
     * @apiDescription Parse a destination
     *
     * @apiExample {shell} Parse a destination
     *    curl -X GET
     *    https://wallet.example/parse/destination?destination=alice@wallet.example
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "ledger": {
     *        "currencyCode": "USD",
     *        "currencySymbol": "$"
     *      }
     *    }
     */
    static * destination () {
      let destination = yield utils.parseDestination({
        destination: this.query.destination,
        retrieveLedgerInfo: true
      })

      this.body = {
        ledger: {
          currencyCode: destination.ledgerInfo && destination.ledgerInfo.currency_code,
          currencySymbol: destination.ledgerInfo && destination.ledgerInfo.currency_symbol
        }
      }
    }

    /**
     * @api {GET} /config Wallet config
     * @apiName GetConfig
     * @apiGroup Misc
     * @apiVersion 1.0.0
     *
     * @apiDescription Get wallet config
     *
     * @apiExample {shell} Get wallet config
     *    curl -X GET
     *    https://wallet.example/config
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "ledgerUri": "https://wallet.example/ledger",
     *      "currencyCode": "USD",
     *      "currencySymbol": "$"
     *    }
     */
    static * config () {
      const ledgerInfo = yield ledger.getInfo()

      let response = {
        ledgerUri: config.data.getIn(['ledger', 'public_uri']),
        currencyCode: ledgerInfo.currency_code,
        currencySymbol: ledgerInfo.currency_symbol,
        track: {
          ga: config.data.getIn(['track', 'ga']),
          mixpanel: config.data.getIn(['track', 'mixpanel'])
        }
      }

      if (config.data.get('reload')) {
        response.reload = true
      }

      this.body = response
    }
  }
}
