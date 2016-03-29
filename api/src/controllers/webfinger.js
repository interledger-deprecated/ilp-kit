"use strict"

// For development
// TODO get rid of this
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = WebfingerControllerFactory

const url = require("url")
const request = require('five-bells-shared/utils/request')
const Log = require('../lib/log')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')

const NotFoundError = require('../errors/not-found-error')

WebfingerControllerFactory.constitute = [Log, Config, Ledger]
function WebfingerControllerFactory (log, config, ledger) {
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

      // TODO rel support

      const parsed = url.parse(this.query.resource);

      // Validate ledger
      if (config.data.getIn(['ledger', 'public_uri']).indexOf(parsed.hostname) < 0) {
        throw new NotFoundError('Unknown account')
      }

      // Validate the ledger account
      const ledgerUser = yield ledger.getAccount({username: parsed.auth}, true)

      // TODO check if the account exists

      this.body = {
        "subject": "acct:" + ledgerUser.name + "@" + parsed.hostname,
        "links": [
          {
            // TODO decide on rel names
            "rel" : "http://webfinger.net/rel/ledgerUri",
            "href" : config.data.getIn(['ledger', 'public_uri'])
          },
          {
            "rel" : "http://webfinger.net/rel/ledgerAccount",
            "href" : config.data.getIn(['ledger', 'public_uri']) + '/accounts/' + ledgerUser.name
          },
          {
            // TODO an actual rel to the docs
            "rel" : "http://webfinger.net/rel/socketIOUri",
            "href" : config.data.getIn(['server', 'base_uri']) + '/socket.io'
          }
        ]
      }
    }
  }
}
