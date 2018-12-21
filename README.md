# nlt-kit
LedgerLoops network node and GUI

[![Tests](https://api.travis-ci.org/ledgerloops/nlt-kit.svg?branch=master)](https://travis-ci.org/ledgerloops/nlt-kit)

Inspired on the now-deprecated [ilp-kit](https://github.com/interledger-deprecated/ilp-kit), this server runs a database and a GUI that allow you to keep trustline ledgers with other users of similar [Network Ledger Technology](https://michielbdejong.com/blog/21.html) servers.

## Development

The following initializes the postgres database and sets up a dev fixture:
```sh
sudo su - postgres
| createuser snap --pwprompt
| | Enter password for new role: snap
| | Enter it again: snap
| createdb -O snap prod
| createdb -O snap dev
| createdb -O snap test
| exit
psql postgresql://snap:snap@localhost/dev < drop.sql
psql postgresql://snap:snap@localhost/dev < schema.sql
psql postgresql://snap:snap@localhost/dev < fixture.sql
npm install
npm test
DATABASE_URL=postgresql://snap:snap@localhost/dev npm start
```

Then browse to http://localhost:3000 and log in as michiel / qwer. For production use, just run schema.sql, and not fixture.sql, to create an empty database. And never run drop.sql in production. :)

## How it works

NLT-KIT is a continuation of the now-deprecated ILP-KIT version 4. It is a server that allows people to administer how much they owe others, and it supports one-to-one as well as multi-hop payments. A few differences with ILP-KIT:

* it only supports one currency, the [Unicurn (UCR)](https://unicurn.com)
* it does not use timeouts on multi-hop transactions ([discussion](https://groups.google.com/forum/#!topic/network-money/Y7mtOxChwLk))
* it uses slightly more flexible [routing hints, called "landmarks"](./docs/Routing.md), in the same way ILP-KIT uses ledger prefixes
* direct payments to users on other servers are also supported (in ILP-KIT version 4, inter-server transactions always had to go via both server admins)
