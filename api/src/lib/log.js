'use strict'

const hub = require('mag-hub')
const mag = require('mag')
const Log = require('five-bells-shared').Log

module.exports = function () {
  return Log(mag, hub)
}
