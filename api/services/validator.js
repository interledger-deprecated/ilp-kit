'use strict'

const Validator = require('five-bells-shared').Validator

const validator = module.exports = new Validator()

validator.loadSchemasFromDirectory(__dirname + '/../schemas')