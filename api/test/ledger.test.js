"use strict"

// Due to https://github.com/interledgerjs/ilp-kit/blob/master/bin/normalizeEnv.js#L24
// this will end up loading ../../test.env.list if process.env.NODE_ENV === 'test':
require('../../bin/env').normalizeEnv()

const constitute = require('constitute')
const Ledger = require('../src/lib/ledger')
const assert = require('chai').assert
const nock = require('nock')

describe('Ledger', () => {
  beforeEach(function () {
    const container = new constitute.Container()
    this.ledger = container.constitute(Ledger)
  })

  afterEach(function () {
    assert(nock.isDone(), 'all nocks must be called')
  })

  it('gets ledger info successfully', function * () {
    nock('http://localhost:3101')
      .get('/')
      .reply(200, {
        info: 'some stuff'
      })

    assert.deepEqual(
      yield this.ledger.getInfo(),
      { info: 'some stuff' })
  })

  it('throws on getInfo error', function * () {
    nock('http://localhost:3101')
      .get('/')
      .reply(404)

    try {
      yield this.ledger.getInfo()
      assert(false, 'getInfo should fail')
    } catch (e) {
      assert(true)
    }
  })

  it('gets an account successfully', function * () {
    nock('http://localhost:3101')
      .get('/accounts/alice')
      .reply(200, {
        info: 'some stuff'
      })

    assert.deepEqual(
      yield this.ledger.getAccount({ username: 'alice', password: 'alice'}),
      { info: 'some stuff' })
  })

  it('uses admin credentials in getAccount', function * () {
    nock('http://localhost:3101', {
        reqheaders: { 'authorization': 'Basic Auth' }
      })
      .get('/accounts/alice')
      .reply(200, {
        info: 'some stuff'
      })

    assert.deepEqual(
      yield this.ledger.getAccount({ username: 'alice'}, true),
      { info: 'some stuff' })
  })

  it('handles a not found error in getAccount', function * () {
    nock('http://localhost:3101')
      .get('/accounts/alice')
      .reply(404, {
        id: 'NotFoundError',
        message: 'error'
      })

    try {
      yield this.ledger.getAccount({ username: 'alice', password: 'alice'}),
      assert(false, 'getAccount should fail')
    } catch (e) {
      assert.equal(e.name, 'NotFoundError')
      assert.equal(e.message, 'error')
    }
  })

  it('handles an unauthorized error in getAccount', function * () {
    nock('http://localhost:3101')
      .get('/accounts/alice')
      .reply(401, {
        id: 'UnauthorizedError',
        message: 'error'
      })

    try {
      yield this.ledger.getAccount({ username: 'alice', password: 'alice'}),
      assert(false, 'getAccount should fail')
    } catch (e) {
      assert.equal(e.name, 'NotFoundError')
      assert.equal(e.message, 'error')
    }
  })

  it('handles an unexpected error in getAccount', function * () {
    nock('http://localhost:3101')
      .get('/accounts/alice')
      .reply(451, {
        id: 'UnavailableForLegalReasons',
        message: 'error'
      })

    try {
      yield this.ledger.getAccount({ username: 'alice', password: 'alice'}),
      assert(false, 'getAccount should fail')
    } catch (e) {
      assert(true)
    }
  })

  it('puts an account successfully', function * () {
    nock('http://localhost:3101')
      .put('/accounts/alice')
      .reply(201, {
        info: 'some stuff'
      })

    assert.deepEqual(
      yield this.ledger.putAccount(
        { username: 'admin', password: 'admin' },
        { name: 'alice', password: 'alice' }),
      { info: 'some stuff' })
  })

  it('handles throws an error when it fails to put account', function * () {
    nock('http://localhost:3101')
      .put('/accounts/alice')
      .reply(404, {
        info: 'some stuff'
      })

    try {
      yield this.ledger.putAccount(
        { username: 'admin', password: 'admin' },
        { name: 'alice', password: 'alice' })
      assert(false, 'putAccount should have failed')
    } catch (e) {
      assert(true)
    }
  })

  describe('createAccount and updateAccount', function () {
    beforeEach(function * () {
      this.reply = { info: 'some stuff' }

      nock('http://localhost:3101')
        .put('/accounts/alice')
        .reply(201, this.reply)
    })

    it('updates account balance if given', function * () {
      assert.deepEqual(
        yield this.ledger.updateAccount({ username: 'alice', balance: '10' }),
        this.reply)
    })

    it('updates the password if given', function * () {
      assert.deepEqual(
        yield this.ledger.updateAccount({ username: 'alice', newPassword: 'password' }),
        this.reply)
    })

    it('uses admin credentials if given', function * () {
      assert.deepEqual(
        yield this.ledger.updateAccount(
          { username: 'alice' },
          { username: 'admin', password: 'admin' }),
        this.reply)
    })

    it('creates an account with no password', function * () {
      assert.deepEqual(
        yield this.ledger.createAccount({ username: 'alice' }),
        this.reply)
    })

    it('creates an account with initial balance', function * () {
      assert.deepEqual(
        yield this.ledger.createAccount({ username: 'alice', balance: '10' }),
        this.reply)
    })

    it('creates an account with a password', function * () {
      assert.deepEqual(
        yield this.ledger.createAccount({ username: 'alice', password: 'password' }),
        this.reply)
    })
  })
})
