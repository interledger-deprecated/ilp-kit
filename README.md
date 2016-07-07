# Five Bells Wallet [![circle][circle-image]][circle-url]

[circle-image]: https://circleci.com/gh/interledger/five-bells-wallet.svg?style=shield&circle-token=65d802e1ea641aabcc95f8d28f2c6ade577716a9
[circle-url]: https://circleci.com/gh/interledger/five-bells-wallet

Five Bells Wallet

## Installation

```bash
npm install
```

## Running Dev Server

```bash
npm run dev
```

## Building and Running Production Server

```bash
npm run build
npm run start
```

Use the following configuration options as environment variables:

Name | Required | Default     | Description |
---- | -------- | ----------- | ----------- |
`API_HOSTNAME` | required | *none* | Publicly visible API hostname.
`API_PORT` | required | *none* | Publicly visible API port.
`API_DB_URI` | required | *none* | (e.g.: postgres://root:password@localhost/wallet) URI for connecting to a database.    
`API_LEDGER_URI` | required | *none* | Ledger URI (requests go to this uri)
`API_LEDGER_ADMIN_NAME` | required | *none* | Ledger admin name
`API_LEDGER_ADMIN_PASS` | required | *none* | Ledger admin pass
`CLIENT_HOST` | required | *none* | Publicly visible hostname
`CLIENT_PORT` | required | *none* | Publicly visible port
`API_PRIVATE_HOSTNAME` | optional | *none* | Private API hostname.
`API_SECRET` | optional | `secret` | Api secret. Used to generate the session, oauth and condition secrets.
`API_RELOAD` | optional | *none* | Turn on/off the reload endpoint
`API_LEDGER_PUBLIC_URI` | optional | *none* | Ledger public URI (used in account URIs). Specified if different from the `API_LEDGER_URI`.
`API_TRACK_GA` | optional | *none* | Google Analytics Tracking ID
`API_TRACK_MIXPANEL` | optional | *none* | Mixpanel Tracking ID
`API_GITHUB_CLIENT_ID` | optional | *none* | Github application client id (used for github oauth)
`API_GITHUB_CLIENT_SECRET` | optional | *none* | Github application client secret (used for github oauth)
`API_MAILGUN_API_KEY` | optional | *none* | Mailgun api key (for sending emails)
`API_MAILGUN_DOMAIN` | optional | *none* | One of the domains attached to the Mailgun account
`WALLET_FORCE_HTTPS` | optional | *none* | Force all connections to use HTTPS
`WALLET_TRUST_XFP_HEADER` | optional | *none* | Trust the `X-Forwarded-Proto` header

### API docs
[http://interledger.org/five-bells-wallet/apidoc](http://interledger.org/five-bells-wallet/apidoc/)

### Webfinger
Five Bells Wallet supports webfinger lookups.

Example request 
```bash
curl -X GET
https://wallet.example/.well-known/webfinger?resource=acct:alice@wallet.example
```

Example response 
```bash
HTTP/1.1 200 OK
{
  "subject": "acct:alice@wallet.example",
  "links": [
    {
      "rel": "http://webfinger.net/rel/ledgerUri",
      "href": "http://wallet.example/ledger"
    },
    {
      "rel": "http://webfinger.net/rel/ledgerAccount",
      "href": "http://wallet.example/ledger/accounts/alice"
    },
    {
      "rel": "http://webfinger.net/rel/socketIOUri",
      "href": "http://wallet.example/api/socket.io"
    }
  ]
}
```

### Using Redux DevTools

In development, Redux Devtools are enabled by default. You can toggle visibility and move the dock around using the following keyboard shortcuts:

- <kbd>Ctrl+H</kbd> Toggle DevTools Dock
- <kbd>Ctrl+Q</kbd> Move Dock Position
- see [redux-devtools-dock-monitor](https://github.com/gaearon/redux-devtools-dock-monitor) for more detail information.

### Theme customization

`npm install` generates a `src/theme/variables.scss` which contains the theme colors. You can manually edit it.
