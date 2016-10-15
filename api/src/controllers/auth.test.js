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

    it('doesn\'t load non-logged-in user', (done) => {
      // auth load gets currently logged in user
      agent
        .get('/auth/load')
        .send() 
        .expect({
          id: 'NotFoundError',
          message: 'No active user session' 
        }, done)
    })

    it('doesn\'t give forgotten password to non-existant user', (done) => {
      // gets forgotten password for requested resource
      agent
        .post('/auth/forgot-password')
        .send({
          // alice doesn't exist right now
          resource: 'alice'
        }) 
        .expect({
          id: 'NotFoundError',
          message: 'Wrong username/email' 
        }, done)
    })

    it('returns forgotten password to user', (done) => {
      // first, create alice
      agent
        .post('/users/alice')
        .send({
          password: 'alice'
        })
        .end(() => {
          agent
            // now send a password reset message
            .post('/auth/forgot-password')
            .send({
              resource: 'alice'
            }) 
            .expect(200)
            .expect({}, done)
        })
    })

    it('won\'t change password for nonexistant user', (done) => {
      agent
        .post('/auth/change-password')
        .send({
          username: 'alice'
        })
        .expect({
          id: 'NotFoundError',
          message: 'Wrong username'
        }, done)
    })

    it('won\'t change password with non-matching passwords', (done) => {
      // create alice
      agent
        .post('/users/alice')
        .send({
          username: 'alice',
          password: 'alice'
        })
        .end(() => {
          agent
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
            }, done)
        })
    })

    it('won\'t change password without code', (done) => {
      // create alice
      agent
        .post('/users/alice')
        .send({
          username: 'alice',
          password: 'alice'
        })
        .end(() => {
          agent
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
            }, done)
        })
    })

    it('won\'t change password with invalid code', (done) => {
      // create alice
      agent
        .post('/users/alice')
        .send({
          username: 'alice',
          password: 'alice'
        })
        .end(() => {
          agent
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
            }, done)
        })
    })

    it('won\'t change password with wrong code', (done) => {
      // create alice
      agent
        .post('/users/alice')
        .send({
          username: 'alice',
          password: 'alice'
        })
        .end(() => {
          agent
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
            }, done)
        })
    })

    it('won\'t change profile without logging in', (done) => {
      // try to change profile
      agent
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
        }, done)
    })

    it('changes profile picture successfully', (done) => {
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
            .end(() => {
              agent
                .post('/auth/profilepic')
                .send({
                  files: {
                    file: {
                      path: 'a.png'  
                    }
                  }
                })
                .expect(200)
                .end(done)
            })
        })
    })

    it('should log out', (done) => {
      // just call logout
      agent
        .post('/auth/logout')
        .send()
        .expect(200)
        .end(done)
    })

  })
})
