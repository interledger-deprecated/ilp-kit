import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';

import auth from './auth';
import send from './send';
import history from './history';
import {reducer as form} from 'redux-form';

export default combineReducers({
  router: routerStateReducer,
  auth,
  send,
  history,
  form
});
