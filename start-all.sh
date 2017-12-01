#!/usr/bin/env bash

(cd ledger && npm start) &
pid1="$!"

(cd api && npm start) &
pid2="$!"

(cd client && npm start) &
pid3="$!"

(cd webserver && npm start) &
pid4="$!"

wait
