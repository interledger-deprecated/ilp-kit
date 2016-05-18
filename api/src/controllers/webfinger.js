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

    /**
     * @api {GET} /webfinger Get webfinger info
     * @apiName GetWebfinger
     * @apiGroup Misc
     * @apiVersion 1.0.0
     *
     * @apiDescription Get webfinger info
     *
     * @apiExample {shell} Get webfinger info
     *    curl -X GET
     *    https://wallet.example/webfinger?resource=acct:alice@wallet.example
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      "subject": "acct:alice@wallet.example",
     *      "links": [
     *        {
     *          "rel": "https://interledger.org/rel/ledgerUri",
     *          "href": "https://wallet.example/ledger"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/socketIOUri",
     *          "href": "https://wallet.example/socket.io"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/ledgerAccount",
     *          "href": "https://wallet.example/ledger/accounts/alice"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/sender/payment",
     *          "href": "https://wallet.example/payments"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/sender/pathfind",
     *          "href": "https://wallet.example/payments/findPath"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/receiver",
     *          "href": "https://wallet.example/receivers/alice"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/receiver/payment",
     *          "href": "https://wallet.example/receivers/alice/payments"
     *        }
     *      ]
     *    }
     */
    static * load () {
      if (!this.query || !this.query.resource) {
        // TODO throw exception
        return this.status = 400
      }

      // TODO rel support

      const parsed = url.parse(this.query.resource);

      // Validate ledger
      if (config.data.getIn(['ledger', 'public_uri']).indexOf(parsed.hostname) < 0) {
        throw new NotFoundError('Unknown account')
      }

      let username

      // resource is an acct:
      if (parsed.auth) {
        username = parsed.auth
      }
      // resource is a http(s):
      else if (parsed.path) {
        username = parsed.path.match(/([^\/]*)\/*$/)[1]
      }
      else {
        throw new NotFoundError('Unknown account')
      }

      // Validate the ledger account
      const ledgerUser = yield ledger.getAccount({username: username}, true)

      this.body = {
        "subject": "acct:" + ledgerUser.name + "@" + parsed.hostname,
        "links": [
          {
            // TODO decide on rel names
            "rel" : "https://interledger.org/rel/ledgerUri",
            "href" : config.data.getIn(['ledger', 'public_uri'])
          },
          {
            // TODO an actual rel to the docs
            "rel" : "https://interledger.org/rel/socketIOUri",
            "href" : config.data.getIn(['server', 'base_uri']) + '/socket.io'
          },
          {
            "rel" : "https://interledger.org/rel/ledgerAccount",
            "href" : config.data.getIn(['ledger', 'public_uri']) + '/accounts/' + ledgerUser.name
          },
          {
            "rel" : "https://interledger.org/rel/sender/payment",
            "href" : config.data.getIn(['server', 'base_uri']) + '/payments'
          },
          {
            "rel" : "https://interledger.org/rel/sender/pathfind",
            "href" : config.data.getIn(['server', 'base_uri']) + '/payments/findPath'
          },
          {
            "rel" : "https://interledger.org/rel/receiver",
            "href" : config.data.getIn(['server', 'base_uri']) + '/receivers/' + ledgerUser.name
          },
          {
            "rel" : "https://interledger.org/rel/receiver/payment",
            "href" : config.data.getIn(['server', 'base_uri']) + '/receivers/' + ledgerUser.name + '/payments'
          }
        ]
      }
    }
  }
}
