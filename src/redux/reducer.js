import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';
import { reducer as form } from 'redux-form';

import auth from './reducers/auth';
import send from './reducers/send';
import history from './reducers/history';

export default combineReducers({
  router: routerStateReducer,
  auth,
  send,
  history,
  form
});
