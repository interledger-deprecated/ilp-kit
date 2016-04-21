#!/bin/sh

command -v apidoc || npm install -g apidoc
git clone git@github.com:interledger/five-bells-wallet.git --branch gh-pages --single-branch doc
apidoc -i api/src/controllers/ -o web/docs
cd web
git add --all
git commit -m '[DOCS] update spec'
git push