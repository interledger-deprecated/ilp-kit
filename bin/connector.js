#!/usr/bin/env node
require('./normalizeEnv')

if (process.env.CONNECTOR_ENABLE) {
  require('../node_modules/ilp-connector/src/index.js').listen()
}
