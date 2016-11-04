"use strict"

const appHelper = require('./helpers/app')
const webfingerMock = require('./data/webfinger')

describe('Webfinger', () => {
  beforeEach(function * () {
    this.agent = yield appHelper.create()

    yield this.agent
      .post('/users/alice')
      .send({
        password: 'alice'
      })
  })

  describe('GET /webfinger', () => {
    it('respond with webfinger object', function * () {
      yield this.agent
        .get('/webfinger')
        .query({resource: 'acct:alice@localhost'})
        .expect(webfingerMock);
    })
  })
})
