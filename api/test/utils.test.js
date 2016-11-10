"use strict"

const constitute = require('constitute')
const Ledger = require('../src/lib/ledger')
const LedgerMock = require('./helpers/ledgerMock')
const Utils = require('../src/lib/utils')
const assert = require('chai').assert
const nock = require('nock')

describe('Utils', () => {
  beforeEach(function * () {
    const container = new constitute.Container()
    container.bindClass(Ledger, LedgerMock)

    this.utils = container.constitute(Utils)
  })

  it('detects a valid account URI', function () {
    assert.isTrue(this.utils.isAccountUri('http://example'))
    assert.isTrue(this.utils.isAccountUri('https://example'))
    assert.isFalse(this.utils.isAccountUri('ftp://example'))
  })

  it('detects foreign account URI', function () {
    assert.isTrue(this.utils.isForeignAccountUri('http://example'))
    assert.isFalse(this.utils.isForeignAccountUri(this.utils.ledgerUriPublic))
    assert.isFalse(this.utils.isAccountUri('ftp://example'))
  })

  it('detects a webfinger identifier', function () {
    assert.isTrue(this.utils.isWebfinger('alice@example.com'))
    assert.isFalse(this.utils.isWebfinger('http://example'))
  })

  it('doesn\'t get an account that doesn\'t exist', function * () {
    try {
      yield this.utils.getAccount('https://example.com/accounts/nonentity')
      assert(false, 'this.util.getAccount should have failed')
    } catch (e) {
      assert(true)
    }
  })

  it('doesn\'t get a webfinger account that doesn\'t exist', function * () {
    try {
      yield this.utils.getWebfingerAccount(
        'https://example.com/accounts/nonentity')
      assert(false, 'this.util.getWebfingerAccount should have failed')
    } catch (e) {
      assert(true)
    }
  })

  describe('Webfinger', () => {
    beforeEach(function () {
      nock('https://example.com')
        .get('/.well-known/webfinger?resource=acct:alice@example.com')
        .reply(200, {
          links: [{
            rel: 'https://interledger.org/rel/ledgerAccount',
            href: 'account'
          }, {
            rel: 'https://interledger.org/rel/ledgerUri',
            href: 'ledger'
          }, {
            rel: 'https://interledger.org/rel/receiver',
            href: 'http://receiver/'
          }, {
            rel: 'https://interledger.org/rel/ilpAddress',
            href: 'address'
          }]
        })

      this.destination = {
        type: 'local',
        accountUri: 'account',
        ledgerUri: 'ledger',
        paymentUri: 'http://receiver/',
        ilpAddress: 'address',
        currencyCode: 'XDG',
        currencySymbol: 'D',
        name: 'alice',
        imageUrl: undefined
      }

      this.webfinger = {
        accountUri: 'account',
        ledgerUri: 'ledger',
        paymentUri: 'http://receiver/',
        ilpAddress: 'address'
      }
    })

    afterEach(function () {
      assert(nock.isDone(), 'nock should be called')
    })

    it('gets a webfinger account with URI', function * () {
      assert.deepEqual(yield this.utils.getWebfingerAccount(
        'https://example.com/accounts/alice'
      ), this.webfinger)
    })

    it('gets a webfinger account with ID', function * () {
      assert.deepEqual(yield this.utils.getWebfingerAccount(
        'alice@example.com'
      ), this.webfinger)
    })

    describe('parseDestination', () => {
      beforeEach(function () {
        nock('http://receiver')
          .get('/')
          .reply(200, {
            name: 'alice',
            imageUrl: 'picture',
            currency_code: 'XDG',
            currency_symbol: 'D'
          })
      })

      it('gets a destination from URI', function * () {
        assert.deepEqual(yield this.utils.parseDestination({
          destination: 'https://example.com/accounts/alice'
        }), this.destination)
      })

      it('gets a destination from Webfinger ID', function * () {
        assert.deepEqual(yield this.utils.parseDestination({
          destination: 'alice@example.com'
        }), this.destination)
      })
    })
  })

  it('gets a destination from non-foreign ID', function * () {
    nock('http://localhost')
      .get('/ledger/accounts/alice')
      .reply(200, {
        name: 'alice',
        imageUrl: 'picture',
        currency_code: 'XDG',
        currency_symbol: 'D'
      })

    nock('http://localhost')
      .get('/api/receivers/alice')
      .reply(200, {
        name: 'alice',
        imageUrl: 'picture',
        currency_code: 'XDG',
        currency_symbol: 'D'
      })

    assert.deepEqual(yield this.utils.parseDestination({
      destination: 'alice'
    }), {
      type: 'local',
      accountUri: 'http://localhost/ledger/accounts/alice',
      ledgerUri: 'http://localhost/ledger',
      paymentUri: 'http://localhost/api/receivers/alice',
      ilpAddress: 'localhost.alice',
      currencyCode: 'XDG',
      currencySymbol: 'D',
      name: 'alice',
      imageUrl: undefined
    })

    assert(nock.isDone(), 'nock should be called')
  })
})
