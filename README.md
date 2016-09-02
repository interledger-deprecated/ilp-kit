# Five Bells Wallet [![circle][circle-image]][circle-url]

[circle-image]: https://circleci.com/gh/interledger/five-bells-wallet.svg?style=shield&circle-token=65d802e1ea641aabcc95f8d28f2c6ade577716a9
[circle-url]: https://circleci.com/gh/interledger/five-bells-wallet

Five Bells Wallet

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Running Dev Wallet](#running-dev-wallet)
  - [Building Production Wallet](#building-production-wallet)
  - [Running Production Wallet](#running-production-wallet)
  - [Port Forwarding](#port-forwarding)
  - [Running a ledger instance in the five-bells-wallet process](#running-a-ledger-instance-in-the-five-bells-wallet-process)
  - [Environment variables](#environment-variables)
- [Interledger Setup](#interledger-setup)
  - [Hosts File](#hosts-file)
  - [Database](#database)
  - [Apache Virtual Hosts](#apache-virtual-hosts)
  - [Wallet 1 + Ledger 1 Instance](wallet-1--ledger-1-instance)
  - [Wallet 2 + Ledger 2 Instance](wallet-2--ledger-2-instance)
  - [Setup five-bells-connector](#setup-five-bells-connector)
- [Architecture](#architecture)
  - [Backend (REST API)](#backend-rest-api)
    - [API docs](#api-docs)
    - [SPSP](#spsp)
      - [Webfinger](#webfinger)
  - [Client](#client)
    - [Using Redux DevTools](#using-redux-devtools)
    - [Theme Customization](#theme-customization)

## Prerequisites

- [Five Bells Ledger](https://github.com/interledger/five-bells-ledger) instance

## Installation

```bash
git clone git@github.com:interledger/five-bells-wallet.git
cd five-bells-wallet
npm install
```

## Usage

### Running Dev Wallet

_You must specify the required environment variables before running the below command_

```bash
npm run dev
```

### Building Production Wallet

```bash
npm run build
```

### Running Production Wallet

_You must specify the required environment variables before running the below command_

```
npm run start
```

### Port forwarding

In most cases it makes sense to expose the wallet through 443 (or 80) port, in which case you need to setup a port forwarding that will forward `API_PORT` requests to `API_PUBLIC_PORT` (443 or 80). Note that the port forwarding should work for both http(s) and websocket connections.

Here's an example of an Apache 2.4 virtual host with enabled port forwarding.

> NOTE: Current webfinger implementation will not work if the public port is not 443 or 80.

> NOTE: At the moment you need to have a 443 virtual host in addition to 80 virtual host if you're use 80 as a public port. 443 virtual host is used for the webfinger lookups. This is a [reported issue](https://github.com/e14n/webfinger/issues/27) in the webfinger lib used by the five-bells-wallet.

```
<VirtualHost *:443> 
  ServerName wallet.com
  
  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet.com:3000/$1 [P,L]

  ProxyPass / http://wallet.com:3000/ retry=0
  ProxyPassReverse / http://wallet.com:3000/
  
  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet.com.key
</VirtualHost> 
```

### Running a ledger instance in the five-bells-wallet process

Unless you're hosting an external ledger, you can optionally run a five-bells-ledger instance inside the five-bells-wallet. 
To do so, all you need to do is leave the `API_LEDGER_URI` environment variable empty, and the software will automatically run a five-bells-ledger instance.

Five-bells-ledger instance comes with default environment variables, but you can change them specifying any of the five-bells-ledger [environment variables](https://github.com/interledger/five-bells-ledger#step-3-run-it).

### Environment variables

##### Required

Name | Example | Description |
---- | ------- | ----------- |
`API_HOSTNAME` | `wallet.com` | API public hostname.
`API_PORT` | `3000` | API private port (used as both public and private port if `API_PUBLIC_PORT` is not specified).
`API_DB_URI` | `postgres://localhost/wallet` | URI for connecting to a database.
`API_LEDGER_ADMIN_NAME` | `admin` | Ledger admin name.
`API_LEDGER_ADMIN_PASS` | `pass` | Ledger admin pass.
`CLIENT_HOST` | `wallet.com` | Publicly visible hostname.
`CLIENT_PORT` | `4000` | Client port.
`LEDGER_ILP_PREFIX` | `wallet.` | This is required if the `API_LEDGER_URI` is not specified

##### Optional

Name | Example | Description |
---- | ------- | ----------- |
`API_PUBLIC_HTTPS` | `''` | Whether or not the publicly visible instance of Five Bells Wallet is using HTTPS.
`API_PRIVATE_HOSTNAME` | `localhost` | Private API hostname.
`API_PUBLIC_PORT` | `''` | Api public port.
`API_SECRET` | `qO2UX+fdl+tg0a1bYt` | Api secret. Used to generate the session, oauth and condition secrets.
`API_RELOAD` | `true` | Turn on/off the reload endpoint.
`API_LEDGER_URI` | `http://wallet.com:2000` | Ledger URI: requests go to this uri (a ledger instance will be started by the wallet if this is not specified).
`API_LEDGER_PUBLIC_URI` | `http://wallet.com/ledger` | Ledger public URI (used in account URIs). Specified if different from the `API_LEDGER_URI`.
`API_TRACK_GA` | `UA-XXXXX-X` | Google Analytics Tracking ID.
`API_TRACK_MIXPANEL` | | Mixpanel Tracking ID.
`API_GITHUB_CLIENT_ID` | | Github application client id (used for github oauth).
`API_GITHUB_CLIENT_SECRET` | | Github application client secret (used for github oauth).
`API_MAILGUN_API_KEY` | | Mailgun api key (for sending emails).
`API_MAILGUN_DOMAIN` | | One of the domains attached to the Mailgun account.
`WALLET_FORCE_HTTPS` | `true` | Force all connections to use HTTPS.
`WALLET_TRUST_XFP_HEADER` | `true` | Trust the `X-Forwarded-Proto` header.
`CLIENT_PUBLIC_PORT` | `80` | Client public port (if different from `CLIENT_PORT`)

##### Default five-bells-ledger environment variables 
(used if the `API_LEDGER_URI` is not specified). You can read more about these variables in the [five-bells-ledger readme](https://github.com/interledger/five-bells-ledger#step-3-run-it).

Name | Default |
---- | ------- |
`LEDGER_DB_URI` | `API_DB_URI + '-ledger'`
`LEDGER_ADMIN_NAME` | `API_LEDGER_ADMIN_NAME`
`LEDGER_ADMIN_PASS` | `API_LEDGER_ADMIN_PASS`
`LEDGER_HOSTNAME` | `API_HOSTNAME`
`LEDGER_PORT` | `API_PORT + 1`
`LEDGER_PUBLIC_PORT` | `CLIENT_PORT`
`LEDGER_PUBLIC_PATH` | `'ledger'`
`LEDGER_CURRENCY_CODE` | `'USD'`
`LEDGER_CURRENCY_SYMBOL` | `'$'`
`LEDGER_PUBLIC_HTTPS` | `API_PUBLIC_HTTPS`

## Interledger Setup
You might want to do an interledger setup to test interledger transfers. In this case you will need at least two wallet instances and a connector. Below is an example setup instructions for two wallets and a connector on a personal machine (development/testing use).

### Hosts file

Edit your hosts file (/private/etc/hosts on OSX). Add these two lines

```
127.0.0.1   wallet1.com
127.0.0.1   wallet2.com
```

### Database

Create 4 postgres databases. `wallet1`, `wallet1-ledger`, `wallet2`, `wallet2-ledger`.

### Apache Virtual Hosts

> Note: The wallet instances are running on port 80, but we also need to setup virtual hosts on port 443 for the webfinger lookups (issue mentioned above).

```
<VirtualHost *:80> 
  ServerName wallet1.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]  
  RewriteRule /(.*) ws://wallet1.com:3010/$1 [P,L]

  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/  
</VirtualHost> 

<VirtualHost *:443> 
  ServerName wallet1.com
  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/
  RedirectMatch ^/$ https://wallet1.com
  
  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet1.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet1.com.key
</VirtualHost>

<VirtualHost *:80> 
  ServerName wallet2.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet2.com:3020/$1 [P,L]

  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
</VirtualHost> 

<VirtualHost *:443> 
  ServerName wallet2.com
  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
  RedirectMatch ^/$ https://wallet2.com
  
  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet2.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet2.com.key
</VirtualHost> 
```

> Note: You can use self signed certificates.

### Wallet 1 + Ledger 1 instance

Run with these environment variables
```
API_PRIVATE_HOSTNAME=localhost
API_HOSTNAME=wallet1.com
API_PORT=3100
API_PUBLIC_PORT=80 
API_PUBLIC_PATH=/api 
API_DB_URI=postgres://localhost/wallet1
API_LEDGER_ADMIN_NAME=admin
API_LEDGER_ADMIN_PASS=admin
API_RELOAD=true
CLIENT_HOST=wallet1.com
CLIENT_PORT=3010
CLIENT_PUBLIC_PORT=80
API_SECRET=qO2UX+fdl+tg0a1bYtXoBVQHN4pkn2hFB5Ont6CYj50=
LEDGER_ILP_PREFIX=wallet1.
```

> Note: Use `LEDGER_DB_SYNC=true` environment variable for both wallet1 and wallet2 to create the ledger db tables first time when you run each of the instances.

### Wallet 2 + Ledger 2

Run with these environment variables
```
API_PRIVATE_HOSTNAME=localhost
API_HOSTNAME=wallet2.com
API_PORT=3200
API_PUBLIC_PORT=80 
API_PUBLIC_PATH=/api 
API_DB_URI=postgres://localhost/wallet2
API_LEDGER_ADMIN_NAME=admin
API_LEDGER_ADMIN_PASS=admin
API_RELOAD=true
CLIENT_HOST=wallet2.com
CLIENT_PORT=3020
CLIENT_PUBLIC_PORT=80
API_SECRET=qO2UX+fdl+tg0a1bYtXoBVQHN4pkn2hFB5Ont6CYj50=
LEDGER_ILP_PREFIX=wallet2.
```

### Setup five-bells-connector

> Note: five-bells-wallet currently works with [five-bells-connector v8.1.0](https://github.com/interledger/five-bells-connector/tree/v8.1.0)

- Create a trader user on both wallet1 and wallet2 instances with username: `trader`, password: `trader`.

Environment Variables
```
CONNECTOR_HOSTNAME=localhost
CONNECTOR_PORT=5000
CONNECTOR_LEDGERS='["USD@http://wallet1.com/ledger","EUR@http://wallet2.com/ledger"]' CONNECTOR_PAIRS='[["USD@http://wallet1.com/ledger", "EUR@http://wallet2.com/ledger"],["EUR@http://wallet2.com/ledger", "USD@http://wallet1.com/ledger"]]'
CONNECTOR_ADMIN_USER=admin 
CONNECTOR_ADMIN_PASS=admin 
CONNECTOR_CREDENTIALS='{"http://wallet1.com/ledger":{"account_uri":"http://wallet1.com/ledger/accounts/trader","username":"trader","password":"trader"},"http://wallet2.com/ledger":{"account_uri":"http://wallet2.com/ledger/accounts/trader","username":"trader","password":"trader"}}'
CONNECTOR_QUOTE_FULL_PATH=true
```

## Architecture
Five Bells Wallet consists of a [Node.js](https://github.com/nodejs/node) (developed on v5.6) backend (REST API) and a client built using [React](https://github.com/facebook/react).

### Backend (REST API)
The backend is responsible for communicating with the ILP ledger, creating accounts, sending payments and keeping the payment history.

#### API docs
[http://interledger.org/five-bells-wallet/apidoc](http://interledger.org/five-bells-wallet/apidoc/)

#### SPSP

The wallet implements [SPSP](https://github.com/interledger/rfcs/blob/master/0009-simple-payment-setup-protocol/0009-simple-payment-setup-protocol.md) for initiating and receiving payments.

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
      "rel": "https://interledger.org/rel/receiver",
      "href": "https://red.ilpdemo.org/api/receivers/alice"
    }
  ]
}
```

### Client
The client is a web app built on [React](https://github.com/facebook/react) that implements user signup/signin, sending payments and payment history.

Client state management is handled by [Redux](https://github.com/reactjs/redux).

#### Using Redux DevTools

In development, Redux Devtools are enabled by default. You can toggle visibility and move the dock around using the following keyboard shortcuts:

- <kbd>Ctrl+H</kbd> Toggle DevTools Dock
- <kbd>Ctrl+Q</kbd> Move Dock Position
- see [redux-devtools-dock-monitor](https://github.com/gaearon/redux-devtools-dock-monitor) for more detail information.

#### Theme Customization

`npm install` generates a `src/theme/variables.scss` which contains the theme colors. You can manually edit it.

Database has two tables: Users and Payments.
