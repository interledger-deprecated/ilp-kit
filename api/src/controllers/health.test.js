"use strict"

const appHelper = require('../../test/helpers/app')

describe('Health', function(){
  let agent

  beforeEach(function * () {
    agent = appHelper.create()
  })

  describe('GET /health', function(){
    it('respond with ok', function(done){
      agent
        .get('/health')
        .expect(200, done);
    })
  })
}) 