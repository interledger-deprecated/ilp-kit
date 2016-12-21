<h1 align="center">
  <a href="https://interledger.org"><img src="https://interledger.org/assets/ilp_logo.svg" width="150"></a>
  <br>
  ILP Kit
</h1>

<h4 align="center">
ILP wallet with hosted ledger and connector instances
</h4>

<br>

[![circle][circle-image]][circle-url]

[circle-image]: https://circleci.com/gh/interledgerjs/ilp-kit.svg?style=shield&circle-token=65d802e1ea641aabcc95f8d28f2c6ade577716a9
[circle-url]: https://circleci.com/gh/interledgerjs/ilp-kit

# Quick Start

### Install dependencies

#### OSX

Requires XCode command line tools.

```sh
$ brew tap homebrew/services
$ brew install postgres libpqxx postgresql
$ brew services start postgresql
```

#### Linux

```sh
$ sudo apt-get update
$ sudo apt-get install libssl-dev python build-essential libpq-dev postgresql postgresql-contrib
```

### Set up ILP Kit

First, create a postgres database.

```sh
$ sudo -u postgres createuser -s myusername # assuming your user is 'myusername'
$ psql
postgres=> ALTER USER myusername WITH PASSWORD 'PASSWORD'; # use a better password
# outputs: ALTER USER
postgres=> \q
$ createdb ilp-kit-quickstart
```

Now clone the ILP Kit and install the dependencies.

```sh
$ git clone https://github.com/interledgerjs/ilp-kit
$ cd ilp-kit
$ npm install
$ npm run build
```

You'll want to use [Localtunnel](https://localtunnel.me) to expose the ILP Kit
to the internet. **NOTE: Because a localtunnel domain can be squatted on, do
not use this to host a permanent ILP Kit.** If you want a permanent solution,
follow the [permanent setup
instructions](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md).

```sh
$ sudo npm install -g localtunnel
$ lt --subdomain quickstart --port 3010 # use a unique subdomain
# leave this running and restart it if it dies
```

In another shell, in your `ilp-kit` folder, configure your ILP Kit:

```sh
$ npm run configure
```

- Postgres DB URI: `postgres://myusername:PASSWORD@localhost/ilp-kit-quickstart`
- Hostname: `quickstart.localtunnel.me`
- Ledger name: `quickstart`
- Currency code: `USD`
- Country code: `US`
- Configure Github: `n`
- Configure Mailgun: `n`
- Username: `quickstart`
- Password: (use the randomly generated suggestion, and write it down)

### Start your ILP Kit

```sh
npm start
```

That's all! You now have a functioning ILP Kit.

# Connect your ILP Kit

Follow [these
instructions](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md#connecting-your-ledger)
in order to peer with another ILP Kit, and send some inter-ledger payments.

If you're looking for someone to peer with, reach out to one of the [known ILP
nodes](https://github.com/interledgerjs/ilp-kit/wiki/Known-ILP-Nodes) or the
[Interledger mailing list](https://www.w3.org/community/interledger/).

# Documentation

- [Setting up a permament ILP Kit](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md)
- [Environment variable documentation](https://github.com/interledgerjs/ilp-kit/blob/master/docs/ENV.md)
- [Development instructions](https://github.com/interledgerjs/ilp-kit/blob/master/docs/DEV.md)
