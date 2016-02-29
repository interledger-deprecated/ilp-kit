import * as types from '../actionTypes';

export function changeTab(tab) {
  return {
    type: types.AUTH_CHANGE_TAB,
    tab: tab
  };
}

export function unmount() {
  return {
    type: types.DESTROY
  };
}

export function isLoaded(globalState) {
  return globalState.auth && globalState.auth.loaded;
}

export function load() {
  return {
    types: [types.AUTH_LOAD, types.AUTH_LOAD_SUCCESS, types.AUTH_LOAD_FAIL],
    promise: (client) => client.get('/auth/load')
  };
}

export function login(fields) {
  return {
    types: [types.LOGIN, types.LOGIN_SUCCESS, types.LOGIN_FAIL],
    promise: (client) => client.post('/auth/login', {
      data: {
        username: fields.username,
        password: fields.password
      }
    })
  };
}

export function logout() {
  return {
    types: [types.LOGOUT, types.LOGOUT_SUCCESS, types.LOGOUT_FAIL],
    promise: (client) => client.get('/auth/logout')
  };
}

export function register(fields) {
  return {
    types: [types.REGISTER, types.REGISTER_SUCCESS, types.REGISTER_FAIL],
    promise: (client) => client.post('/auth/register', {
      data: {
        username: fields.username,
        password: fields.password
      }
    })
  };
}

export function reload(opts) {
  return (dispatch) => {
    return dispatch({
      types: [types.RELOADING, types.RELOAD_SUCCESS, types.RELOAD_FAIL],
      promise: (client) => client.post('/users/' + opts.username + '/reload')
        .then(() => {
          dispatch({
            type: types.UPDATE_BALANCE,
            // TODO don't hardcode
            change: 1000
          });
        })
    });
  };
}
