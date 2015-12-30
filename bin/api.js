#!/usr/bin/env node
if (process.env.NODE_ENV !== 'production') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json$)/i,
    respawnOnExit: false
  })) {
    return;
  }
}
require('../api.babel'); // babel registration (runtime transpilation for node)
require('../api');
