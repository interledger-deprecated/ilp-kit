"use strict"

module.exports = MiscControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')
const utils = require('../lib/utils')

MiscControllerFactory.constitute = [Auth, Log, Config, Ledger]
function MiscControllerFactory (Auth, log, config, ledger) {
  log = log('misc')

  return class MiscController {
    static init (router) {
      router.get('/analyze/destination', Auth.isAuth, this.destination)
      router.get('/config', this.config)
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

    static * config () {
      const ledgerInfo = yield ledger.getInfo()

      this.body = {
        ledgerUri: config.data.getIn(['ledger', 'public_uri']),
        currency_code: ledgerInfo.currency_code,
        currency_symbol: ledgerInfo.currency_symbol
      }
    }
  }
}
