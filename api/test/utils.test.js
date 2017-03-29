"use strict"

const constitute = require('constitute')
const Ledger = require('../src/lib/ledger')
const LedgerMock = require('./helpers/ledgerMock')
const Utils = require('../src/lib/utils')
const assert = require('chai').assert
const nock = require('nock')

function nockAcct() {
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
        rel: 'https://interledger.org/rel/spsp/v2',
        href: 'http://receiver/'
      }, {
        rel: 'https://interledger.org/rel/ilpAddress',
        href: 'address'
      }]
    })
}

function nockUri() {
  nock('https://example.com')
    .get('/.well-known/webfinger?resource=https://example.com/accounts/alice')
    .reply(200, {
      links: [{
        rel: 'https://interledger.org/rel/ledgerAccount',
        href: 'account'
      }, {
        rel: 'https://interledger.org/rel/ledgerUri',
        href: 'ledger'
      }, {
        rel: 'https://interledger.org/rel/spsp/v2',
        href: 'http://receiver/'
      }, {
        rel: 'https://interledger.org/rel/ilpAddress',
        href: 'address'
      }]
    })
}


function nockHost() {
  nock('https://ilp-kit.somebody.com')
    .get('/.well-known/webfinger?resource=https://ilp-kit.somebody.com')
    .reply(200, {
      properties: {
        'https://interledger.org/rel/publicKey': 'some-pub-key'
      },
      links: [{
        rel: 'https://interledger.org/rel/peersRpcUri',
        href: 'peers-rpc-uri-href'
      }]
    })
}

function nockHostEmpty() {
  nock('https://ilp-kit.somebody.com')
    .get('/.well-known/webfinger?resource=https://ilp-kit.somebody.com')
    .reply(200, {
      properties: {},
      links: []
    })
}


function nockDestinationLocal() {
  nock('https://localhost:80')
    .get('/api/spsp/alice')
    .reply(200, {
      name: 'alice',
      imageUrl: 'picture',
      currency_code: 'XDG',
      currency_symbol: 'D'
    })
}
function nockDestinationRemote() {
  nock('http://receiver')
    .get('/')
    .reply(200, {
      name: 'alice',
      imageUrl: 'picture',
      currency_code: 'XDG',
      currency_symbol: 'D'
    })
}
function nockMalformed() {
  nock('https://mal.formed')
    .get('/.well-known/webfinger?resource=acct:alice@mal.formed')
    .reply(200, {
      links: {
        rel: 'https://interledger.org/rel/ledgerAccount',
        href: 'account'
      }
    })
}

describe('Utils', () => {
  beforeEach(function * () {
    const container = new constitute.Container()
    container.bindClass(Ledger, LedgerMock)

    this.utils = container.constitute(Utils)
  })

  describe('isWebfinger', function() {
    it('detects a webfinger identifier', function () {
      assert.isTrue(this.utils.isWebfinger('alice@example.com'))
      assert.isFalse(this.utils.isWebfinger('https://example.com'))
      assert.isFalse(this.utils.isWebfinger('http://example'))
      assert.isFalse(this.utils.isWebfinger('alice'))
    })
  })

  describe('getWebfingerAccount', function() {
    it('doesn\'t get an account that doesn\'t exist', function * () {
      try {
        yield this.utils.getWebfingerAccount('https://example.com/accounts/nonentity')
        assert(false, 'this.util.getWebfingerAccount should have failed')
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
  })

  describe('getWebfingerAddress', function() {
    // tested below in 'gets a webfinger account
  })
  describe('webfingerLookup', function() {
    // called from getWebfingerAccount, so it's also
    // tested below in 'gets a webfinger account'
  })

  describe('Webfinger', () => {
    beforeEach(function() {
      this.destinationLocal = {
        ledgerUri: 'https://red.ilpdemo.org/ledger',
        paymentUri: 'https://localhost:80/api/spsp/alice',
        ilpAddress: 'us.usd.red.alice',
        currencyCode: 'XDG',
        currencySymbol: 'D',
        identifier: 'alice@localhost:80',
        name: 'alice',
        imageUrl: undefined
      }

      this.destinationRemote = {
        ledgerUri: 'ledger',
        paymentUri: 'http://receiver/',
        identifier: 'alice@example.com',
        ilpAddress: 'address',
        currencyCode: 'XDG',
        currencySymbol: 'D',
        name: 'alice',
        imageUrl: undefined
      }

      this.webfinger = {
        ledgerUri: 'ledger',
        paymentUri: 'http://receiver/',
        ilpAddress: 'address'
      }

      this.webfingerHost = {
        peersRpcUri: 'peers-rpc-uri-href',
        publicKey: 'some-pub-key'
      }
    })

    afterEach(function () {
      assert(nock.isDone(), 'nock should be called')
    })

    it('gets a webfinger account with URI', function * () {
      nockUri()
      var result = yield this.utils.getWebfingerAccount(
        'https://example.com/accounts/alice'
      )
      assert.deepEqual(result, this.webfinger)
    })

    it('gets a webfinger account with ID', function * () {
      nockAcct()
      assert.deepEqual(yield this.utils.getWebfingerAccount(
        'alice@example.com'
      ), this.webfinger)
    })

    describe('parseDestination', () => {
      beforeEach(function() {
      })

      // SPSP addresses of the form https://example.com/accounts/alice
      // is not currently supported, so skipping this test:
      it.skip('gets a destination from URI', function * () {
        nockDestinationLocal()
        nockUri()
        assert.deepEqual(yield this.utils.parseDestination({
          destination: 'https://example.com/accounts/alice'
        }), this.destinationLocal)
      })

      it('gets a destination from Webfinger ID', function * () {
        nockAcct()
        nockDestinationRemote()
        assert.deepEqual(yield this.utils.parseDestination({
          destination: 'alice@example.com'
        }), this.destinationRemote)
      })
    })

    it('doesn\'t get a malformed webfinger record (bug #204)', function * () {
      try {
        yield this.utils.getWebfingerAccount(
          'alice@mal.formed')
        assert(false, 'this.util.getWebfingerAccount should have failed')
      } catch (e) {
        assert(nock.isDone(), 'nock should be called')
      }
    })

    it('gets a destination from non-foreign ID', function * () {
      nockDestinationLocal()
      assert.deepEqual(yield this.utils.parseDestination({
        destination: 'alice'
      }), this.destinationLocal)

      assert(nock.isDone(), 'nock should be called')
    })

    describe('hostLookup', function() {
      it('gets host data from webfinger', function * () {
        nockHost()
        assert.deepEqual(yield this.utils.hostLookup(
          'https://ilp-kit.somebody.com'
        ), this.webfingerHost)
        assert(nock.isDone(), 'nock should be called')
      })

      it('doesn\'t get incompatible host data from webfinger', function * () {
        nockHostEmpty()
        try {
          assert.deepEqual(yield this.utils.hostLookup(
            'https://ilp-kit.somebody.com'
          ), this.webfingerHost)
          assert(false, 'this.util.hostLookup should have failed')
        } catch (e) {
          assert(nock.isDone(), 'nock should be called')
        }
      })
    })

  })

})
