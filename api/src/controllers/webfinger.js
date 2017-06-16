'use strict'

// For development
// TODO get rid of this
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

module.exports = WebfingerControllerFactory

const url = require('url')
const Config = require('../lib/config')
const Ledger = require('../lib/ledger')

const NotFoundError = require('../errors/not-found-error')

function WebfingerControllerFactory (deps) {
  const config = deps(Config)
  const ledger = deps(Ledger)

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
     *          'rel': 'https://interledger.org/rel/ilpAddress',
     *          'href': "alice.wallet"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/sender/payment",
     *          "href": "https://wallet.example/payments"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/sender/quote",
     *          "href": "https://wallet.example/payments/quote"
     *        },
     *        {
     *          "rel": "https://interledger.org/rel/spsp/v2",
     *          "href": "https://wallet.example/spsp/alice"
     *        }
     *      ]
     *    }
     */
    static async load (ctx) {
      if (!ctx.query || !ctx.query.resource) {
        // TODO throw exception
        ctx.status = 400
        return
      }

      // TODO rel support
      const parsed = url.parse(ctx.query.resource)

      // Validate ledger
      if (config.data.getIn(['ledger', 'public_uri']).indexOf(parsed.hostname) < 0) {
        throw new NotFoundError('Unknown account')
      }

      let username

      // resource is an acct:
      if (parsed.auth) {
        username = parsed.auth
      // resource is a http(s):
      } else if (parsed.path) {
        username = parsed.path.match(/([^/]*)\/*$/)[1]
      } else {
        throw new NotFoundError('Unknown account')
      }

      // Account lookup
      if (username) {
        // Validate the ledger account
        const ledgerUser = await ledger.getAccount({ username: username }, true)

        ctx.body = {
          'subject': 'acct:' + ledgerUser.name + '@' + parsed.hostname,
          'links': [
            {
              // TODO decide on rel names
              'rel': 'https://interledger.org/rel/ledgerUri',
              'href': config.data.getIn(['ledger', 'public_uri'])
            },
            {
              // TODO an actual rel to the docs
              'rel': 'https://interledger.org/rel/socketIOUri',
              'href': config.data.getIn(['server', 'base_uri']) + '/socket.io'
            },
            {
              'rel': 'https://interledger.org/rel/ilpAddress',
              'href': config.data.getIn(['ledger', 'prefix']) + ledgerUser.name
            },
            {
              'rel': 'https://interledger.org/rel/sender/payment',
              'href': config.data.getIn(['server', 'base_uri']) + '/payments'
            },
            {
              'rel': 'https://interledger.org/rel/sender/quote',
              'href': config.data.getIn(['server', 'base_uri']) + '/payments/quote'
            },
            {
              'rel': 'https://interledger.org/rel/spsp/v2',
              'href': config.data.getIn(['server', 'base_uri']) + '/spsp/' + ledgerUser.name
            }
          ]
        }
        return
      }

      // Host lookup
      ctx.body = {
        'subject': config.data.get('client_host'),
        'properties': {
          'https://interledger.org/rel/publicKey': config.data.getIn(['connector', 'public_key']),
          'https://interledger.org/rel/protocolVersion': 'Compatible: ilp-kit v' + config.data.getIn(['ilpKitVersion'])
        },
        'links': [
          {
            'rel': 'https://interledger.org/rel/ledgerUri',
            'href': config.data.getIn(['ledger', 'public_uri'])
          },
          {
            'rel': 'https://interledger.org/rel/peersRpcUri',
            'href': config.data.getIn(['server', 'base_uri']) + '/peers/rpc'
          },
          {
            'rel': 'https://interledger.org/rel/settlementMethods',
            'href': config.data.getIn(['server', 'base_uri']) + '/settlement_methods'
          }
        ]
      }
    }
  }
}
