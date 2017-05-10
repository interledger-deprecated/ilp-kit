'use strict'

const appHelper = require('./helpers/app')
const webfingerMock = require('./data/webfinger')

describe('Webfinger', () => {
  beforeEach(async function () {
    this.agent = await appHelper.create()

    await this.agent
      .post('/users/alice')
      .send({
        password: 'alice'
      })
  })

  describe('GET /webfinger', () => {
    it.skip('respond with webfinger object', async function () {
      await this.agent
        .get('/webfinger')
        .query({resource: 'acct:alice@localhost'})
        .expect(webfingerMock)
    })
  })
})
