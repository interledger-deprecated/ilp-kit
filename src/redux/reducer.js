import { combineReducers } from 'redux'
import { routeReducer } from 'react-router-redux'
import { reducer as reduxAsyncConnect } from 'redux-async-connect'
import { reducer as form } from 'redux-form'

import auth from './reducers/auth'
import send from './reducers/send'
import history from './reducers/history'
import stats from './reducers/stats'
import invite from './reducers/invite'

export default combineReducers({
  routing: routeReducer,
  reduxAsyncConnect,
  auth,
  send,
  history,
  stats,
  invite,
  form
})
