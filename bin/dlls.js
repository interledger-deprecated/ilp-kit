#!/usr/bin/env node
require('./env').normalizeEnv()

const exec = require('child_process').exec
const cmd = 'node_modules/.bin/webpack --progress --config webpack/dll.config.js'

exec(cmd, (error, stdout) => {
  console.log(stdout)
})
