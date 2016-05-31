import {expect} from 'chai'
import superagent from 'superagent'
import superagentMocker from 'superagent-mocker'
import configureMockStore from 'redux-mock-store'
import ApiClient from '../../helpers/ApiClient'
import Tracker from '../../tracker'
import createMiddleware from '../middleware/clientMiddleware'
import * as types from '../actionTypes'
import * as actions from './auth'

const client = new ApiClient()
const middlewares = [createMiddleware(client)]

const tracker = new Tracker()
global.tracker = tracker

const mockRequest = superagentMocker(superagent)
const mockStore = configureMockStore(middlewares)

describe('(action creator) Auth', () => {
  beforeEach(() => {
    mockRequest.clearRoutes()
  })

  it('.reload creates RELOADING, RELOAD_SUCCESS actions', () => {
    mockRequest.post('/api/users/alice/reload', () => {
      return {}
    })

    const expectedActions = [
      {type: types.RELOADING},
      {type: types.RELOAD_SUCCESS, result: undefined}
    ]
    const store = mockStore({})

    return store.dispatch(actions.reload({username: 'alice'}))
      .then(() => {
        expect(store.getActions()).to.eql(expectedActions)
      })
  })
})
