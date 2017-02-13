"use strict"

const appHelper = require('./helpers/app')
const exampleApiData = require('./data/api')

describe('Auth', () => {

  beforeEach(function * () {
    this.agent = yield appHelper.create()

    // Create the user
    yield this.agent
      .post('/users/alice')
      .send({
        username: 'alice',
        password: 'alice'
      })
      .expect(201)
  })

  describe('/auth/', () => {
    it.skip('login user', function * () {
      // Try to login
      yield this.agent
        .post('/auth/login')
        .send({
          username: 'alice',
          password: 'alice'
        })
        .expect(exampleApiData.accounts.alice)
    })

    it.skip('doesn\'t load non-logged-in user', function * () {
      // log out first
      yield this.agent
        .post('/auth/logout')
        .send()
        .expect(200)

      // auth load gets currently logged in user
      yield this.agent
        .get('/auth/load')
        .send() 
        .expect({
          id: 'NotFoundError',
          message: 'No active user session' 
        })
    })

    it.skip('doesn\'t give forgotten password to non-existant user', function * () {
      // gets forgotten password for requested resource
      yield this.agent
        .post('/auth/forgot-password')
        .send({
          // bob doesn't exist
          resource: 'bob'
        })
        .expect({
          id: 'NotFoundError',
          message: 'Wrong username/email' 
        })
    })

    it.skip('returns forgotten password to user', function * () {
      // Try to login
      yield this.agent
        .post('/auth/login')
        .send({
          username: 'alice',
          password: 'alice'
        })

      yield this.agent
        // now send a password reset message
        .post('/auth/forgot-password')
        .send({
          resource: 'alice'
        }) 
        .expect(200)
        .expect({})
    })

    it.skip('won\'t change password for nonexistant user', function * () {
      yield this.agent
        .post('/auth/change-password')
        .send({
          username: 'bob'
        })
        .expect({
          id: 'NotFoundError',
          message: 'Wrong username'
        })
    })

    it.skip('won\'t change password with non-matching passwords', function * () {
      // log out first
      yield this.agent
        .post('/auth/logout')
        .send()
        .expect(200)

      yield this.agent
        .post('/auth/change-password')
        .send({
          // sends two passwords but they don't match
          username: 'alice',
          password: 'alice1',
          repeatPassword: 'alice2'
        })
        .expect({
          id: 'PasswordsDontMatchError',
          message: 'Passwords don\'t match'
        })
    })

    it.skip('won\'t change password without code', function * () {
      yield this.agent
        .post('/auth/change-password')
        .send({
          // missing 'code' field
          username: 'alice',
          password: 'alice1',
          repeatPassword: 'alice1',
        })
        .expect({
          id: 'InvalidBodyError',
          message: 'Missing code'
        })
    })

    it.skip('won\'t change password with invalid code', function * () {
      yield this.agent
        .post('/auth/change-password')
        .send({
          // code needs to be 'date.secret'
          username: 'alice',
          password: 'alice1',
          repeatPassword: 'alice1',
          code: '11'
        })
        .expect({
          id: 'InvalidBodyError',
          message: 'Invalid code'
        })
    })

    it.skip('won\'t change password with wrong code', function * () {
      yield this.agent
        .post('/auth/change-password')
        .send({
          // date and secret in code are incorrect
          username: 'alice',
          password: 'alice1',
          repeatPassword: 'alice1',
          code: '1.1'
        })
        .expect({
          id: 'InvalidBodyError',
          message: 'The code has been expired'
        })
    })

    it.skip('won\'t change profile without logging in', function * () {
      // log out first
      yield this.agent
        .post('/auth/logout')
        .send()
        .expect(200)

      // try to change profile
      yield this.agent
        .post('/auth/profilepic')
        .send({
          files: {
            file: {
              path: 'a.png'
            }
          }
        })
        .expect({
          id: 'NotFoundError',
          message: 'No active user session'
        })
    })

    it.skip('changes profile picture successfully', function * () {
      // Try to login
      yield this.agent
        .post('/auth/login')
        .send({
          username: 'alice',
          password: 'alice'
        })

      // send the new profile picture
      const response = yield this.agent
        .post('/auth/profilepic')
        .send({
          files: {
            file: {
              path: 'a.png'  
            }
          }
        })
        .expect(200)
    })

    it.skip('should log out', function * () {
      // Try to login
      yield this.agent
        .post('/auth/login')
        .send({
          username: 'alice',
          password: 'alice'
        })

      yield this.agent
        .post('/auth/logout')
        .send()
        .expect(200)
    })
  })
})
