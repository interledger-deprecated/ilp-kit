#!/usr/bin/env node
if (process.env.NODE_ENV !== 'production') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json$)/i,
    respawnOnExit: false
  })) {
    return
  }
}

require('./env').normalizeEnv()
require('../api/app')
