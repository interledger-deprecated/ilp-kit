"use strict"

module.exports = MiscControllerFactory

const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const Auth = require('../lib/auth')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')
const Utils = require('../lib/utils')
const InvalidLedgerAccountError = require('../errors/invalid-ledger-account-error')

MiscControllerFactory.constitute = [Auth, Log, Config, Ledger, Utils]
function MiscControllerFactory (Auth, log, config, ledger, utils) {
  log = log('misc')

  return class MiscController {
    static init (router) {
      router.get('/analyze/destination', Auth.isAuth, this.destination)
      router.get('/config', this.config)
    }

    static * destination () {
      let destination

      try {
        destination = yield utils.parseDestination({
          destination: this.query.destination,
          retrieveLedgerInfo: true
        })
      } catch(e) {
        // TODO differentiate doesn't exist from parsing error
        throw new InvalidLedgerAccountError("Account doesn't exist")
      }

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
        currencyCode: ledgerInfo.currency_code,
        currencySymbol: ledgerInfo.currency_symbol
      }
    }
  }
}
