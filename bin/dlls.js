#!/usr/bin/env node
require('./env').normalizeEnv()

const exec = require('child_process').exec
const cmd = 'node_modules/.bin/webpack --progress --config webpack/dll.config.js'

exec(cmd, { maxBuffer: 1000 * 1024 }, (error, stdout) => {
  if (error) {
    console.error(error)
  }
  console.log(stdout)
})
