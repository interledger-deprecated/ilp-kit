"use strict"

module.exports = MiscControllerFactory

const request = require('five-bells-shared/utils/request')
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
      router.get('/analyze/destination', this.destination)
      router.get('/config', this.config)
    }

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
     * @api {GET} /config Get wallet config
     * @apiName GetConfig
     * @apiGroup Config
     * @apiVersion 1.0.0
     *
     * @apiDescription Get wallet config
     *
     * @apiExample {shell} Find path
     *    curl -X GET
     *    http://wallet.example/config
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "ledgerUri": "http://wallet.example/ledger",
     *      "currencyCode": "USD",
     *      "currencySymbol": "$"
     *    }
     */
    static * config () {
      const ledgerInfo = yield ledger.getInfo()

      this.body = {
        ledgerUri: config.data.getIn(['ledger', 'public_uri']),
        currencyCode: ledgerInfo.currency_code,
        currencySymbol: ledgerInfo.currency_symbol
      }
    }
  }
}
