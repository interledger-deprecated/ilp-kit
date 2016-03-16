"use strict"

module.exports = AnalyzeControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const utils = require('../lib/utils')

AnalyzeControllerFactory.constitute = [Auth, Log, Config]
function AnalyzeControllerFactory (Auth, log, config) {
  log = log('analyze')

  return class AnalyzeController {
    static init (router) {
      router.get('/analyze/destination', Auth.isAuth, this.destination)
    }

    static * destination () {
      let destination = yield utils.parseDestination({
        destination: this.query.destination,
        currentLedgerUri: config.data.getIn(['ledger', 'public_uri']),
        retrieveLedgerInfo: true
      })

      this.body = {
        ledger: {
          currencyCode: destination.ledgerInfo && destination.ledgerInfo.currency_code,
          currencySymbol: destination.ledgerInfo && destination.ledgerInfo.currency_symbol
        }
      }
    }
  }
}
