# Environment variables

##### Required

Name | Example | Description |
---- | ------- | ----------- |
`API_HOSTNAME` | `wallet.com` | API public hostname.
`API_PORT` | `3000` | API private port (used as both public and private port if `API_PUBLIC_PORT` is not specified).
`API_DB_URI` | `postgres://localhost/wallet` | URI for connecting to a database.
`API_LEDGER_ADMIN_USER` | `admin` | Ledger admin username.
`API_LEDGER_ADMIN_PASS` | `pass` | Ledger admin pass.
`CLIENT_HOST` | `wallet.com` | Publicly visible hostname.
`CLIENT_PORT` | `4000` | Client port.
`LEDGER_ILP_PREFIX` | `wallet.` | This is required if the `API_LEDGER_URI` is not specified

##### Optional

Name | Example | Description |
---- | ------- | ----------- |
`API_PUBLIC_HTTPS` |  | Whether or not the publicly visible instance of ILP kit is using HTTPS.
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
`LEDGER_DB_URI` | `API_DB_URI`
`LEDGER_ADMIN_USER` | `API_LEDGER_ADMIN_USER`
`LEDGER_ADMIN_PASS` | `API_LEDGER_ADMIN_PASS`
`LEDGER_HOSTNAME` | `API_HOSTNAME`
`LEDGER_PORT` | `API_PORT + 1`
`LEDGER_PUBLIC_PORT` | `CLIENT_PORT`
`LEDGER_PUBLIC_PATH` | `ledger`
`LEDGER_CURRENCY_CODE` | `USD`
`LEDGER_CURRENCY_SYMBOL` | `$`
`LEDGER_PUBLIC_HTTPS` | `API_PUBLIC_HTTPS`
