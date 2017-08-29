#!/usr/bin/env bash

npm install
(cd ledger && npm install)
(cd api && npm install)
(cd client && npm install)
(cd webserver && npm install)
