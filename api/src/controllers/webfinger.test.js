"use strict"

const appHelper = require('../../test/helpers/app')
const webfingerMock = require('../../test/data/webfinger')

describe('Webfinger', function(){
  let agent

  beforeEach(function * () {
    agent = appHelper.create()
  })

  describe('GET /webfinger', function(){
    it('respond with webfinger object', function(done){
      agent
        .get('/webfinger')
        .query({resource: 'acct:alice@localhost'})
        .expect(webfingerMock, done);
    })
  })
})