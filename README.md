# nlt-kit
LedgerLoops network node and GUI

Inspired on the now-deprecated [ilp-kit](https://github.com/interledger-deprecated/ilp-kit), this server runs a database and a GUI that allow you to keep trustline ledgers with other users of similar [Network Ledger Technology](https://michielbdejong.com/blog/21.html) servers.


The following initializes the postgres database, sets up a fixture, and tests a two-hop payment from michiel (who sets the hashlock) to edward to donald (who holds the preimage):
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
DATABASE_URL=postgresql://snap:snap@localhost/dev npm start

# michiel -> edward:
curl -H 'Authorization: Basic bWljaGllbDpxd2Vy' -X'PUT' http://localhost:3000/sendroutes -d '1'
# edward  -> donald:
curl -H 'Authorization: Basic ZWR3YXJkOnF3ZXI=' -X'PUT' http://localhost:3000/sendroutes -d '4'
# donald -> michiel:
curl -H 'Authorization: Basic ZG9uYWxkOnF3ZXI=' -X'PUT' http://localhost:3000/sendroutes -d '6'

# topup:
curl -H 'Authorization: Basic bWljaGllbDpxd2Vy' -X'PUT' http://localhost:3000/topup -d '{"contactName":"Eddie","amount":5}'

# pay:
curl -H 'Authorization: Basic bWljaGllbDpxd2Vy' -X'PUT' http://localhost:3000/pay -d '{"contactName":"Eddie","amount":1,"condition":"bc21571c5f1968c083c5740bb0879bde3f61c787e3c41540cd3290604f70bbed"}'
```

Ability to do this from the GUI instead of via curl coming soon.

Then browse to http://localhost:3000 and log in as michiel / qwer
