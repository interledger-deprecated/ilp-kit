'use strict'

const appHelper = require('./helpers/app')

describe('Health', function () {
  beforeEach(function * () {
    this.agent = yield appHelper.create()
  })

  describe('GET /health', function () {
    it('respond with ok', function * () {
      yield this.agent
        .get('/health')
        .expect(200)
    })
  })
})
