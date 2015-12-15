import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';

import auth from './auth';
import send from './send';
import {reducer as form} from 'redux-form';

export default combineReducers({
  router: routerStateReducer,
  auth,
  send,
  form
});
