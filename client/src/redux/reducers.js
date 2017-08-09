import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
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
import webpayments from './reducers/webpayments'

export default combineReducers({
  router: routerReducer,
  loadingBar: loadingBarReducer,
  form,

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
  webpayments
})
