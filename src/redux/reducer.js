import { combineReducers } from 'redux'
import { routeReducer } from 'react-router-redux'
import { reducer as reduxAsyncConnect } from 'redux-async-connect'
import { reducer as form } from 'redux-form'
import { loadingBarReducer } from 'react-redux-loading-bar'

import auth from './reducers/auth'
import send from './reducers/send'
import history from './reducers/history'
import stats from './reducers/stats'
import invite from './reducers/invite'
import peer from './reducers/peer'
import settlementMethod from './reducers/settlement_method'
import settlement from './reducers/settlement'
import user from './reducers/user'

export default combineReducers({
  routing: routeReducer,
  reduxAsyncConnect,
  auth,
  send,
  history,
  stats,
  invite,
  peer,
  settlementMethod,
  settlement,
  user,
  form: form.normalize({
    peerAdd: {
      currency: value => value && value.toUpperCase()
    }
  }),
  loadingBar: loadingBarReducer
})
