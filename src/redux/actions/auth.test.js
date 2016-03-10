import {expect} from 'chai'
import superagent from 'superagent'
import superagentMocker from 'superagent-mocker'
import configureMockStore from 'redux-mock-store'
import ApiClient from '../../helpers/ApiClient'
import createMiddleware from '../middleware/clientMiddleware'
import * as types from '../actionTypes'
import * as actions from './auth'

const client = new ApiClient()
const middlewares = [createMiddleware(client)]

const mockRequest = superagentMocker(superagent);
const mockStore = configureMockStore(middlewares)

describe('(action creator) Auth', () => {
  beforeEach(function(){
    mockRequest.clearRoutes()
  })

  it('.reload creates RELOADING, UPDATE_BALANCE, RELOAD_SUCCESS actions', (done) => {
    mockRequest.post('/api/users/alice/reload', function() {return {}})

    const expectedActions = [
      {type: types.RELOADING},
      {type: types.UPDATE_BALANCE, change: 1000},
      {type: types.RELOAD_SUCCESS, result: undefined}
    ]
    const store = mockStore({}, expectedActions, done)
    actions.reload({username: 'alice'})(store.dispatch)
  })
})