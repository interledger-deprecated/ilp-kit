import { combineReducers } from 'redux'
import { routeReducer } from 'react-router-redux'
import { reducer as reduxAsyncConnect } from 'redux-connect'
import { reducer as form } from 'redux-form'
import { loadingBarReducer } from 'react-redux-loading-bar'

import auth from './reducers/auth'
import send from './reducers/send'
import activity from './reducers/activity'
import stats from './reducers/stats'
import invite from './reducers/invite'
import peer from './reducers/peer'
import settlementMethod from './reducers/settlement_method'
import settlement from './reducers/settlement'
import withdrawal from './reducers/withdrawal'
import user from './reducers/user'

export default combineReducers({
  routing: routeReducer,
  reduxAsyncConnect,
  auth,
  send,
  activity,
  stats,
  invite,
  peer,
  settlementMethod,
  settlement,
  withdrawal,
  user,
  form,
  loadingBar: loadingBarReducer
})
