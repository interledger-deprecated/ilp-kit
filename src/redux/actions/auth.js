import * as types from '../actionTypes'

export function changeTab(tab) {
  return {
    type: types.AUTH_CHANGE_TAB,
    tab: tab
  }
}

export function unmount() {
  return {
    type: types.DESTROY
  }
}

export function isLoaded(globalState) {
  return globalState.auth && globalState.auth.loaded
}

export function register(fields) {
  return {
    types: [types.REGISTER, types.REGISTER_SUCCESS, types.REGISTER_FAIL],
    promise: (client) => client.post('/users/' + fields.username, {
      data: {
        username: fields.username,
        password: fields.password,
        email: fields.email
      }
    }).then((user) => {
      if (!__SERVER__) {
        if (socket) {
          socket.connect()
          socket.emit('subscribe', user.username)
        }

        tracker.identify(user.username)
      }

      return user
    })
  }
}

export function reload(opts) {
  // TODO move tracker to components
  tracker.track('reload')

  return {
    types: [types.RELOADING, types.RELOAD_SUCCESS, types.RELOAD_FAIL],
    promise: (client) => client.post('/users/' + opts.username + '/reload')
  }
}

export function loadConfig() {
  return {
    types: [types.LOAD_CONFIG, types.LOAD_CONFIG_SUCCESS, types.LOAD_CONFIG_FAIL],
    promise: (client) => client.get('/config')
  }
}

export function updateBalance(balance) {
  return {
    type: types.UPDATE_BALANCE,
    balance: balance
  }
}

export function load() {
  return (dispatch) => {
    return dispatch({
      types: [types.AUTH_LOAD, types.AUTH_LOAD_SUCCESS, types.AUTH_LOAD_FAIL],
      promise: (client) => client.get('/auth/load')
        .then((user) => {
          if (!__SERVER__) {
            if (socket) {
              socket.connect()
              socket.emit('subscribe', user.username)
            }

            tracker.identify(user.username)
          }

          return user
        })
    })
  }
}

export function login(fields) {
  return (dispatch) => {
    return dispatch({
      types: [types.LOGIN, types.LOGIN_SUCCESS, types.LOGIN_FAIL],
      promise: (client) => client.post('/auth/login', {
        data: {
          username: fields.username,
          password: fields.password
        }
      }).then((user) => {
        if (!__SERVER__) {
          if (socket) {
            socket.connect()
            socket.emit('subscribe', user.username)
          }

          tracker.identify(user.username)
        }

        return user
      })
    })
  }
}

export function logout() {
  return {
    types: [types.LOGOUT, types.LOGOUT_SUCCESS, types.LOGOUT_FAIL],
    promise: (client) => client.post('/auth/logout')
      .then((user) => {
        tracker.clearIdentity()

        return user
      })
  }
}

export function save(opts, data) {
  return {
    types: [types.AUTH_SAVE, types.AUTH_SAVE_SUCCESS, types.AUTH_SAVE_FAIL],
    promise: (client) => client.put('/users/' + opts.username, {data})
  }
}

export function resendVerificationEmail(username) {
  return {
    types: [types.EMAIL_VERIFICATION_RESEND, types.EMAIL_VERIFICATION_RESEND_SUCCESS, types.EMAIL_VERIFICATION_RESEND_FAIL],
    promise: (client) => client.post('/users/' + username + '/resendVerification')
  }
}

export function verify(username, code) {
  return {
    types: [types.EMAIL_VERIFICATION, types.EMAIL_VERIFICATION_SUCCESS, types.EMAIL_VERIFICATION_FAIL],
    promise: (client) => client.put('/users/' + username + '/verify', {data: {code}})
  }
}
