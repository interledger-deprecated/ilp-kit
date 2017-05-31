/* globals __CLIENT__, socket, tracker */

import * as types from '../actionTypes'

export const isLoaded = globalState => globalState.auth && globalState.auth.loaded

export const register = data => ({
  types: [types.REGISTER, types.REGISTER_SUCCESS, types.REGISTER_FAIL],
  promise: client => client.post('/users/' + data.username, { data })
    .then(user => {
      if (__CLIENT__) {
        tracker.identify(user.username)
      }

      return user
    })
})

export const reload = opts => {
  // TODO move tracker to components
  tracker.track('reload')

  return {
    types: [types.RELOADING, types.RELOAD_SUCCESS, types.RELOAD_FAIL],
    promise: (client) => client.post('/users/' + opts.username + '/reload')
  }
}

export const loadConfig = () => ({
  types: [types.LOAD_CONFIG, types.LOAD_CONFIG_SUCCESS, types.LOAD_CONFIG_FAIL],
  promise: (client) => client.get('/config')
})

export const updateBalance = balance => ({
  type: types.UPDATE_BALANCE,
  balance: balance
})

export const load = () => dispatch => dispatch({
  types: [types.AUTH_LOAD, types.AUTH_LOAD_SUCCESS, types.AUTH_LOAD_FAIL],
  promise: (client) => client.get('/auth/load')
    .then(user => {
      if (__CLIENT__) {
        tracker.identify(user.username)
      }

      return user
    })
})

export const login = data => dispatch => dispatch({
  types: [types.LOGIN, types.LOGIN_SUCCESS, types.LOGIN_FAIL],
  promise: client => client.post('/auth/login', { data })
    .then(user => {
      if (__CLIENT__) {
        tracker.identify(user.username)
      }

      return user
    })
})

export const forgot = data => ({
  types: [types.FORGOT_PASSWORD, types.FORGOT_PASSWORD_SUCCESS, types.FORGOT_PASSWORD_FAIL],
  promise: client => client.post('/auth/forgot-password', {
    data: {
      resource: data.resource
    }
  })
})

export const changePassword = data => ({
  types: [types.CHANGE_PASSWORD, types.CHANGE_PASSWORD_SUCCESS, types.CHANGE_PASSWORD_FAIL],
  promise: client => client.post('/auth/change-password', {
    data: {
      code: data.code,
      username: data.username,
      password: data.password,
      repeatPassword: data.repeatPassword
    }
  })
})

export const logout = () => ({
  types: [types.LOGOUT, types.LOGOUT_SUCCESS, types.LOGOUT_FAIL],
  promise: client => client.post('/auth/logout')
    .then(user => {
      tracker.clearIdentity()

      window.location.reload()

      return user
    })
})

export const updatePic = () => ({
  type: types.AUTH_UPDATE_PIC
})

export const save = (opts, data) => ({
  types: [types.AUTH_SAVE, types.AUTH_SAVE_SUCCESS, types.AUTH_SAVE_FAIL],
  promise: client => client.put('/users/' + opts.username, {data})
})

export const resendVerificationEmail = username => ({
  types: [types.EMAIL_VERIFICATION_RESEND, types.EMAIL_VERIFICATION_RESEND_SUCCESS, types.EMAIL_VERIFICATION_RESEND_FAIL],
  promise: client => client.post('/users/' + username + '/resend-verification')
})

export const verify = (username, code) => ({
  types: [types.EMAIL_VERIFICATION, types.EMAIL_VERIFICATION_SUCCESS, types.EMAIL_VERIFICATION_FAIL],
  promise: client => client.put('/users/' + username + '/verify', {data: {code}})
})

export const locationUpdate = () => ({
  type: types.UPDATE_LOCATION_COMPLETE
})

export const advancedModeToggle = () => (dispatch, getState) => dispatch({
  type: types.SET_ADVANCED_MODE,
  result: !getState().auth.advancedMode
})
