#!/bin/sh

command -v apidoc || npm install -g apidoc
git clone git@github.com:interledger/five-bells-wallet.git --branch gh-pages --single-branch doc
apidoc -i api/src/controllers/
cd doc
git add .
git commit -m '[DOCS] update spec'
git push