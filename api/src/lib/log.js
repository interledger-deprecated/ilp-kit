'use strict'

const hub = require('mag-hub')
const mag = require('mag')
const Log = require('five-bells-shared').Log

let log
module.exports = function () {
  if (log) {
    return log
  }

  log = Log(mag, hub)

  return log
}
