"use strict"

const appHelper = require('../../test/helpers/app')
const webfingerMock = require('../../test/data/webfinger')

describe('Webfinger', () => {
  let agent

  beforeEach((done) => {
    agent = appHelper.create()

    agent
      .post('/users/alice')
      .send({
        password: 'alice'
      })
      .end(done)
  })

  describe('GET /webfinger', () => {
    it('respond with webfinger object', (done) => {
      agent
        .get('/webfinger')
        .query({resource: 'acct:alice@localhost'})
        .expect(webfingerMock, done);
    })
  })
})
