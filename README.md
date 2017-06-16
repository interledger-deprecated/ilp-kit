<h1 align="center">
  <a href="https://interledger.org"><img src="https://interledger.org/assets/ilp_logo.svg" width="150"></a>
  <br>
  ILP Kit
</h1>

<h4 align="center">
ILP wallet with hosted ledger and connector instances
</h4>

<br>

[![circle][circle-image]][circle-url] [![Deploy to Heroku][heroku-deploy-image]][heroku-deploy-url] [![FOSSA Status][fossa-image]][fossa-url]


[heroku-deploy-image]: https://www.herokucdn.com/deploy/button.svg
[heroku-deploy-url]: https://heroku.com/deploy?template=https://github.com/interledgerjs/ilp-kit/tree/release
[circle-image]: https://circleci.com/gh/interledgerjs/ilp-kit.svg?style=shield&circle-token=65d802e1ea641aabcc95f8d28f2c6ade577716a9
[circle-url]: https://circleci.com/gh/interledgerjs/ilp-kit
[fossa-image]: https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Finterledgerjs%2Filp-kit.svg?type=shield
[fossa-url]: https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Finterledgerjs%2Filp-kit?ref=badge_shield


## [Setup](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md)

* The easy way: [with docker-compose](https://github.com/interledgerjs/ilp-kit-docker-compose)
* The hard way: [ubuntu manual setup](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md)
* On Google Cloud Engine: https://github.com/sappenin/ilpkit-google-cloud/tree/master/ilpkit-gce-single
* On Heroku: https://heroku.com/deploy?template=https://github.com/interledgerjs/ilp-kit/tree/release

## [Development](https://github.com/interledgerjs/ilp-kit/blob/master/docs/DEV.md)

See https://github.com/interledgerjs/ilp-kit/blob/master/docs/DEV.md

## Table of contents

- [Environment variables](#environment-variables)
- [Advanced Mode](#advanced-mode)
- [Architecture](#architecture)
  - [Backend (REST API)](#backend-rest-api)
    - [API docs](#api-docs)
    - [SPSP](#spsp)
      - [Webfinger](#webfinger)
  - [Client](#client)
    - [Using Redux DevTools](#using-redux-devtools)
    - [Theme Customization](#theme-customization)

## Environment variables

Note: Most of the variables can either be set as environment variable or in a config file. The default config file is `env.list`. Environment variables take precedence over variables set in the config file.

##### Required

Name | Example | Description |
---- | ------- | ----------- |
`API_HOSTNAME` | `wallet.com` | API public hostname.
`API_PORT` | `3000` | API private port (used as both public and private port if `API_PUBLIC_PORT` is not specified).
`DB_URI` | `postgres://localhost/wallet` | URI for connecting to a database.
`API_LEDGER_ADMIN_USER` | `admin` | Ledger admin username.
`API_LEDGER_ADMIN_PASS` | `pass` | Ledger admin pass.
`CLIENT_HOST` | `wallet.com` | Publicly visible hostname.
`CLIENT_PORT` | `4000` | Client port.
`LEDGER_ILP_PREFIX` | `wallet.` | This is required if the `API_LEDGER_URI` is not specified

##### Optional

Name | Example | Description |
---- | ------- | ----------- |
`API_CONFIG_FILE` | custom-env.list | Specifies the path from which to load the config file. **Needs to be defined as environment variable**.
`API_PRIVATE_HOSTNAME` | `localhost` | Private API hostname.
`API_PUBLIC_PORT` |  | Api public port.
`API_SECRET` | `qO2UX+fdl+tg0a1bYt` | Api secret. Used to generate the session, oauth and condition secrets.
`API_RELOAD` | `true` | Turn on/off the reload endpoint.
`API_LEDGER_URI` | `http://wallet.com:2000` | Ledger URI: requests go to this uri (a ledger instance will be started by the wallet if this is not specified).
`API_LEDGER_PUBLIC_URI` | `http://wallet.com/ledger` | Ledger public URI (used in account URIs). Specified if different from the `API_LEDGER_URI`.
`API_TRACK_GA` | `UA-XXXXX-X` | Google Analytics Tracking ID.
`API_TRACK_MIXPANEL` | | Mixpanel Tracking ID.
`API_GITHUB_CLIENT_ID` | | Github application client id (used for github oauth).
`API_GITHUB_CLIENT_SECRET` | | Github application client secret (used for github oauth).
`API_MAILGUN_API_KEY` | | Mailgun api key (for sending emails).
`API_MAILGUN_DOMAIN` | `wallet.com` | One of the domains attached to the Mailgun account.
`API_ANTIFRAUD_SERVICE_URL` | `antifraud.wallet.com` | Anti fraud service url. This will enable an additional step in registration that asks for personal details
`API_ANTIFRAUD_MAX_RISK` | `20` | Maximum tolerable risk level for the registration
`API_EMAIL_SENDER_NAME` | `info` | Email sender name
`API_EMAIL_SENDER_ADDRESS` | `contact@wallet.com` | Email sender address
`API_REGISTRATION` | `true` | Enable/Disable registration
`WALLET_FORCE_HTTPS` | `true` | Force all connections to use HTTPS.
`WALLET_TRUST_XFP_HEADER` | `true` | Trust the `X-Forwarded-Proto` header.
`CONNECTOR_ENABLE` | `false` | Run a connector instance
`CLIENT_PUBLIC_PORT` | `80` | Client public port (if different from `CLIENT_PORT`)
`CLIENT_TITLE` | `ILP Kit` | Browser title and logo

##### Default five-bells-ledger environment variables 
(used if the `API_LEDGER_URI` is not specified). You can read more about these variables in the [five-bells-ledger readme](https://github.com/interledgerjs/five-bells-ledger#step-3-run-it).

Name | Default |
---- | ------- |
`LEDGER_DB_URI` | `DB_URI`
`LEDGER_ADMIN_USER` | `API_LEDGER_ADMIN_USER`
`LEDGER_ADMIN_PASS` | `API_LEDGER_ADMIN_PASS`
`LEDGER_HOSTNAME` | `API_HOSTNAME`
`LEDGER_PORT` | `API_PORT + 1`
`LEDGER_PUBLIC_PORT` | `CLIENT_PORT`
`LEDGER_PUBLIC_PATH` | `ledger`
`LEDGER_CURRENCY_CODE` | `USD`
`LEDGER_CURRENCY_SYMBOL` | `$`

## Advanced Mode
ILP kit UI comes with an "advanced mode" for developers and advanced users. You can activate it with a hot-key: `option+d` on Mac or `alt+d` on Windows. 

## Architecture
ILP kit consists of:
* a Five Bells ledger (the 'ledger' process)
* a [Node.js](https://github.com/nodejs/node) (developed on v7.7.1) 'api' process, containing a connector and SPSP receivers
* html+js+css statics, built using [React](https://github.com/facebook/react)
* a 'server' process which serves the statics on example.com, the ledger on example.com/ledger, the api on example.com/api
* an nginx instance in front the server process, which handles https termination

### Backend (REST API)
The backend is responsible for communicating with the ILP ledger, creating accounts, sending payments and keeping the payment history.

#### API docs
- stable (`release` branch) - [https://interledgerjs.github.io/ilp-kit/apidoc](https://interledgerjs.github.io/ilp-kit/apidoc/)
- latest (`master` branch)  - [https://interledgerjs.github.io/ilp-kit/apidoc/master](https://interledgerjs.github.io/ilp-kit/apidoc/master/)

#### How it works

The wallet implements [SPSP](https://github.com/interledger/rfcs/blob/master/0009-simple-payment-setup-protocol/0009-simple-payment-setup-protocol.md) for initiating and receiving payments.

This means it announces an SPSP address of the form `user@host`, and links this to two things:
* an ILP address (roughly of the form `g.us.usd.host.user`, but this is not enforced, and your ILP address is not a unique string)
* a cryptographic key pair, used indirectly to generate and fulfill crypto conditions.

The connector component can peer with other connectors on the Interledger, and basically acts as a router.

The ledger can handle payments that are conditional on a cryptographic condition, and that's where the power of ILP lies.
When you send money to an account on another ledger, your connector conditionally pays the next connector, all the way to the receiving connector.
The receiving connector adds a conditional payment to the receiving ledger, and the receiver (which lives in the API component) fulfills the
crypto condition, using (a key which from) the receiver's public key.

Only the receiver of an Interledger payment can fulfill the crypto condition, and that's why you can be sure that the intermediate hops will all
roll back if the money cannot be safely delivered.

##### Webfinger
Webfinger is used to lookup account/user identifiers.

Example request 
```bash
curl -X GET
https://wallet.example/.well-known/webfinger?resource=acct:alice@wallet.example
```

Example response 
```bash
HTTP/1.1 200 OK
{
  "subject": "acct:alice@red.ilpdemo.org",
  "links": [
    {
      "rel": "https://interledger.org/rel/ledgerUri",
      "href": "https://red.ilpdemo.org/ledger"
    },
    {
      "rel": "https://interledger.org/rel/socketIOUri",
      "href": "https://red.ilpdemo.org/api/socket.io"
    },
    {
      "rel": "https://interledger.org/rel/ledgerAccount",
      "href": "https://red.ilpdemo.org/ledger/accounts/alice"
    },
    {
      "rel": "https://interledger.org/rel/sender/payment",
      "href": "https://red.ilpdemo.org/api/payments"
    },
    {
      "rel": "https://interledger.org/rel/sender/pathfind",
      "href": "https://red.ilpdemo.org/api/payments/findPath"
    },
    {
      "rel": "https://interledger.org/rel/spsp/v2",
      "href": "https://red.ilpdemo.org/api/spsp/alice"
    }
  ]
}
```

### Client
The client is a web app built on [React](https://github.com/facebook/react) that implements user signup/signin, sending payments and payment history.

Client state management is handled by [Redux](https://github.com/reactjs/redux).

#### Theme Customization

`npm install` generates a `src/theme/variables.scss` which contains the theme colors. You can manually edit it.

Database has two tables: Users and Payments.
