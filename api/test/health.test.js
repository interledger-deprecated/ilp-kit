'use strict'

const appHelper = require('./helpers/app')

describe('Health', function () {
  beforeEach(async function () {
    this.agent = await appHelper.create()
  })

  describe('GET /health', function () {
    it('respond with ok', async function () {
      await this.agent
        .get('/health')
        .expect(200)
    })
  })
})
