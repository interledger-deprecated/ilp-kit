'use strict'

const assert = require('chai').assert

const EmailTakenError = require('../src/errors/email-taken-error')
const InvalidBodyError = require('../src/errors/invalid-body-error')
const InvalidVerificationError = require('../src/errors/invalid-verification-error')
const LedgerInsufficientFundsError = require('../src/errors/ledger-insufficient-funds-error')
const NoQuoteError = require('../src/errors/no-quote-error')
const ServerError = require('../src/errors/server-error')
const UsernameTakenError = require('../src/errors/username-taken-error')

describe('Errors', () => {
  beforeEach(function () {
    this.ctx = {}
    this.log = {
      warn: () => {},
      debug: () => {}
    }
  })

  it('makes an EmailTakenError', async function () {
    const err = new EmailTakenError('test')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 422)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes an InvalidBodyError', async function () {
    const err = new InvalidBodyError('test', ['a', 'b', 'c'])
    err.debugPrint(this.log, {subErrors: ['a', 'b', 'c']})
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 400)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes an InvalidVerificationError', async function () {
    const err = new InvalidVerificationError('test')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 400)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes a LedgerInsufficientFundsError', async function () {
    const err = new LedgerInsufficientFundsError('test', 'alice')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 422)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes a NoQuoteError', async function () {
    const err = new NoQuoteError('test')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 404)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes a ServerError', async function () {
    const err = new ServerError('test')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 500)
    assert.equal(this.ctx.body.message, 'test')
  })

  it('makes a UsernameTakenError', async function () {
    const err = new UsernameTakenError('test')
    await err.handler(this.ctx, this.log)
    assert.equal(this.ctx.status, 422)
    assert.equal(this.ctx.body.message, 'test')
  })
})
