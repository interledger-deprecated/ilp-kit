"use strict"

const appHelper = require('./helpers/app')
const assert = require('chai').assert

describe('Users', () => {

  beforeEach(function * () {
    this.agent = yield appHelper.create()

    // Create the user
    yield this.agent
      .post('/users/alice')
      .send({
        username: 'alice',
        password: 'alice',
        email: 'alice@example.com'
      })
      .expect(201)
  })

  it.skip('should get a user by name', function * () {
    yield this.agent
      .get('/users/alice')
      .expect({
        id: 1,
        username: 'alice',
        name: null,
        email: 'alice@example.com',
        email_verified: null,
        github_id: null,
        profile_picture: null,
        balance: 1000
      })
  })

  it.skip('should 404 if auth user and user dont match', function * () {
    yield this.agent
      .get('/users/bob')
      .expect(404)
  })

  it.skip('should return 422 on existing user', function * () {
    yield this.agent
      .post('/users/alice')
      .send({
        username: 'alice',
        password: 'alice',
      })
      .expect(422)
  })

  it.skip('should return 422 on existing email', function * () {
    yield this.agent
      .post('/users/steve')
      .send({
        username: 'steve',
        password: 'steve',
        email: 'alice@example.com'
      })
      .expect(422)
  })

  it.skip('should change email', function * () {
    yield this.agent
      .put('/users/alice')
      .send({
        email: 'alice@another.com'
      })
      .expect(200)
  })

  it.skip('should change password', function * () {
    yield this.agent
      .put('/users/alice')
      .send({
        password: 'alice',
        verifyPassword: 'alice',
      })
      .expect(200)
  })

  it.skip('should fail if passwords don\'t match', function * () {
    yield this.agent
      .put('/users/alice')
      .send({
        password: 'alice',
        verifyPassword: 'qwertyuiop',
      })
      .expect(422)
  })

  it.skip('should reload an account', function * () {
    yield this.agent
      .post('/users/alice/reload')
      .expect(200)
  })

  it.skip('should verify an email address', function * () {
    yield this.agent
      .put('/users/alice/verify')
      .send({
        code: this.agent.App.User.getVerificationCode('alice@example.com')
      })
      .expect(200)
  })

  it.skip('should not verify with wrong code', function * () {
    yield this.agent
      .put('/users/alice/verify')
      .send({
        code: 'garbage'
      })
      .expect(400)
  })

  it.skip('should resend verification', function * () {
    yield this.agent
      .post('/users/alice/resend-verification')
      .expect(200)
  })

  it.skip('should get receiver', function * () {
    yield this.agent
      .get('/spsp/alice')
      .expect({
        type: 'payee',
        account: 'localhost.alice',
        currency_code: 'USD',
        currency_symbol: '$',
        name: null,
        image_url: null
      })
  })

  it.skip('should fail to get nonexistant receiver', function * () {
    yield this.agent
      .get('/spsp/bob')
      .expect(404)
  })
})
