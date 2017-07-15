'use strict'

const tokenGenerator = require('../src/lib/token')
const jwt = require('jsonwebtoken')
const assert = require('assert')
const reduct = require('reduct')
const sinon = require('sinon')
const moment = require('moment')

const START_DATE = 1499126400000 // Tue Jul 04 2017 00:00:00 GMT+0000

describe('Token', () => {

  beforeEach(function () {
    const deps = reduct()
    this.tokenGen = new tokenGenerator(deps)
    this.clock = sinon.useFakeTimers(START_DATE, 'Date')
  })

  afterEach(function () {
    this.clock.restore()
  })

  it('creates a token without expiry', function () {
    const token = this.tokenGen.get('some.prefix')
    const expectedToken = {
      sub: 'some.prefix',
      iat: moment(Date.now()).unix(), // issuing timestamp in seconds
    }
    assert.deepStrictEqual(expectedToken, jwt.decode(token))
  })

  it('creates a token with expiry', function () {
    const token = this.tokenGen.get('some.prefix', 60)
    const expectedToken = {
      sub: 'some.prefix',
      iat: moment(Date.now()).unix(), // issuing timestamp in seconds
      exp: moment(Date.now()).add(60, 'seconds').unix() // expiry timestamp in seconds
    }
    assert.deepStrictEqual(expectedToken, jwt.decode(token))
  })

  it('verifies a token', function () {
    const token = this.tokenGen.get('some.prefix')
    const isValid = this.tokenGen.isValid('some.prefix', token)
    assert(isValid)
  })

  it('rejects a token if the prefix does not match', function () {
    const token = this.tokenGen.get('some.prefix')
    const isValid = this.tokenGen.isValid('another.prefix', token)
    assert(!isValid)
  })

  it('rejects a token that is expired', function () {
    const token = this.tokenGen.get('some.prefix', 10)
    assert(this.tokenGen.isValid('some.prefix', token))
    this.clock.tick(20000) // 20 seconds later the token should have expired
    assert(!this.tokenGen.isValid('some.prefix', token))
  })
})
