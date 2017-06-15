'use strict'

module.exports = MiscControllerFactory

const Config = require('../lib/config')
const Ledger = require('../lib/ledger')
const Utils = require('../lib/utils')
const currencySymbolMap = require('currency-symbol-map').currencySymbolMap
const Connector = require('../lib/connector')
const InvalidBodyError = require('../errors/invalid-body-error')

function MiscControllerFactory (deps) {
  const config = deps(Config)
  const ledger = deps(Ledger)
  const utils = deps(Utils)
  const connector = deps(Connector)

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
     *        "ledgerUri": "http://wallet.example/ledger",
     *        "paymentUri": "http://wallet.example/api/spsp/alice",
     *        "ilpAddress": "wallet.alice",
     *        "identifier": "alice@wallet.example",
     *        "currencyCode": "USD",
     *        "currencySymbol": "$",
     *        "name": "Alice",
     *        "imageUrl": "http://wallet.example/api/users/alice/profilepic"
     *    }
     */
    static async destination (ctx) {
      const destination = ctx.query.destination

      if (!destination) {
        throw new InvalidBodyError('No destination specified')
      }

      ctx.body = await utils.parseDestination({ destination })
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
     *      "clientUri": "https://wallet.example",
     *      "ledgerUri": "https://wallet.example/ledger",
     *      "currencyCode": "USD",
     *      "currencyScale": 9,
     *      "currencySymbol": "$",
     *      "registration": true,
     *      "antiFraud": false,
     *      "title": "Wallet Name",
     *      "track": {},
     *      "githubAuth": false,
     *      "versions": {
     *        "current": "2.0.2",
     *        "hash": "bc056cc",
     *        "latest": "2.0.2"
     *      },
     *      "settlementMethods": [
     *        {
     *          "id": "7b4a73b0-19c5-46ed-8905-febeae2b0a05",
     *          "name": "Paypal",
     *          "type": "paypal",
     *          "description": null,
     *          "uri": null,
     *          "logo": "https://wallet.example/paypal.png"
     *        }
     *      ]
     *    }
     */
    static async config (ctx) {
      const ledgerInfo = await ledger.getInfo()

      // A previous version accidentally leaked the Github client secret. Be
      // careful when handling credentials
      const githubClientId = config.data.getIn(['github', 'client_id'])
      const githubClientSecret = config.data.getIn(['github', 'client_secret'])
      const isGithubAuthEnabled = Boolean(
        typeof githubClientId === 'string' &&
        githubClientId.length > 0 &&
        typeof githubClientScret === 'string' &&
        githubClientSecret.length > 0
      )

      const response = {
        clientUri: config.data.get('client_host'),
        ledgerUri: config.data.getIn(['ledger', 'public_uri']),
        currencyCode: ledgerInfo.currency_code,
        currencyScale: ledgerInfo.scale,
        currencySymbol: currencySymbolMap[ledgerInfo.currency_code] || ledgerInfo.currency_code,
        registration: config.data.get('registration'),
        antiFraud: !!config.data.getIn(['antifraud', 'service_url']),
        title: config.data.get('client_title'),
        track: {
          ga: config.data.getIn(['track', 'ga']),
          mixpanel: config.data.getIn(['track', 'mixpanel'])
        },
        githubAuth: isGithubAuthEnabled,
        sentry_dsn: config.data.get('sentry_dsn'),
        versions: await config.getVersions()
      }

      response.settlementMethods = await connector.getSelfSettlementMethods(false, 0)

      if (config.data.get('reload')) {
        response.reload = true
      }

      ctx.body = response
    }
  }
}
