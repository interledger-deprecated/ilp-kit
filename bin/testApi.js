#!/usr/bin/env node
require('./env').normalizeEnv()

const exec = require('child_process').exec
const cmd = 'istanbul test -- _mocha'

// TODO maybe use spawn
exec(cmd, (error, stdout) => {
  console.log(stdout)
})
