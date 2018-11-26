# nlt-kit
LedgerLoops network node and GUI

Inspired on the now-deprecated [ilp-kit](https://github.com/interledger-deprecated/ilp-kit), this server runs a database and a GUI that allow you to keep trustline ledgers with other users of similar [Network Ledger Technology](https://michielbdejong.com/blog/21.html) servers.


The following initializes the postgres database, sets up a fixture, and tests a two-hop payment from michiel (who sets the hashlock) to edward to donald (who holds the preimage):
```sh
sudo su - postgres
| createuser snap --pwprompt
| | Enter password for new role: snap
| | Enter it again: snap
| createdb -O snap snap
| exit
psql postgresql://snap:snap@localhost/snap < drop.sql
psql postgresql://snap:snap@localhost/snap < schema.sql
psql postgresql://snap:snap@localhost/snap < fixture.sql
npm install
DATABASE_URL=postgresql://snap:snap@localhost/snap npm start
curl -H 'Authorization: Basic bWljaGbDpxd2Vy' -X'PUT' http://localhost:3000/pay -d '{"contactName":"Eddie","amount":1,"condition":"bc21571c5f1968c083c5740bb0879bde3f61c787e3c41540cd3290604f70bbed"}'
```

Ability to do this from the GUI instead of via curl coming soon.

Then browse to http://localhost:3000 and log in as michiel / qwer
