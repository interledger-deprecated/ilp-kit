#!/bin/sh

command -v apidoc || npm install -g apidoc
git clone git@github.com:interledger/five-bells-wallet.git --branch gh-pages --single-branch web
apidoc -i api/src/controllers/ -o web/apidoc
cd web
git add --all
git commit -m '[DOCS] update spec'
git push