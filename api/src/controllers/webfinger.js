"use strict"

// For development
// TODO get rid of this
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = WebfingerControllerFactory

const url = require("url")
const request = require('five-bells-shared/utils/request')
const Log = require('../lib/log')
const Config = require('../lib/config')

WebfingerControllerFactory.constitute = [Log, Config]
function WebfingerControllerFactory (log, config) {
  log = log('auth')

  return class WebfingerController {
    static init (router) {
      router.get('/webfinger', this.load)
    }

    static * load () {
      if (!this.query || !this.query.resource) {
        // TODO throw exception
        this.status = 400
        this.body = {}
        return
      }

      // TODO if resource not found, throw 404
      // TODO rel support

      const parsed = url.parse(this.query.resource);

      const ledger = parsed.hostname
      const account = parsed.auth

      // TODO Validate hostname. It should be the current running instance
      // TODO check if the account exists

      this.body = {
        "subject": "acct:" + account + "@" + ledger,
        "links": [
          {
            // TODO decide on rel names
            "rel" : "http://webfinger.net/rel/ledgerUri",
            "href" : config.data.getIn(['ledger', 'uri'])
          },
          {
            "rel" : "http://webfinger.net/rel/ledgerAccount",
            "href" : config.data.getIn(['ledger', 'uri']) + '/accounts/' + account
          }
        ]
      }
    }
  }
}
