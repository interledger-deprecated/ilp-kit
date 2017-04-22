'use strict'

const hub = require('mag-hub')
const mag = require('mag')
const Log = require('five-bells-shared').Log
const ValueFactory = require('constitute').ValueFactory

module.exports = new ValueFactory(Log(mag, hub))
