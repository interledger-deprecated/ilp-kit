"use strict"

const appHelper = require('../../test/helpers/app')
const exampleApiData = require('../../test/data/api')

describe('Auth', () => {
  let agent

  beforeEach(() => {
    agent = appHelper.create()
  })

  describe('POST /auth/login', () => {
    it('login user', (done) => {
      // Create the user
      agent
        .post('/users/alice')
        .send({
          password: 'alice'
        })
        .end(() => {
          // Try to login
          agent
            .post('/auth/login')
            .send({
              username: 'alice',
              password: 'alice'
            })
            .expect(exampleApiData.accounts.alice, done)
        })
    })
  })
})
