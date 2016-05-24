import * as types from '../actionTypes'

export const initialState = {
  loaded: false,
  fail: {},
  config: {},
  verified: false
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.AUTH_LOAD:
      return {
        ...state,
        loading: true
      };
    case types.AUTH_LOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        user: action.result
      };
    case types.AUTH_LOAD_FAIL:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: action.error
      };
    case types.AUTH_SAVE_SUCCESS:
      return {
        ...state,
        user: action.result
      };
    case types.EMAIL_VERIFICATION_SUCCESS:
      return {
        ...state,
        verified: true,
        user: state.user && {
          ...state.user,
          email_verified: true
        }
      };
    case types.EMAIL_VERIFICATION_RESEND_SUCCESS:
      return {
        ...state,
        verificationEmailSent: true
      };
    case types.LOAD_CONFIG_SUCCESS:
      return {
        ...state,
        config: action.result
      };
    case types.LOGIN:
      return {
        ...state,
        loggingIn: true
      };
    case types.LOGIN_SUCCESS:
      return {
        ...state,
        loggingIn: false,
        user: action.result,
        verified: false
      };
    case types.LOGIN_FAIL:
      return {
        ...state,
        loggingIn: false,
        user: null,
        fail: action.error
      };
    case types.REGISTER:
      return {
        ...state,
        registering: true
      };
    case types.REGISTER_SUCCESS:
      return {
        ...state,
        registering: false,
        user: action.result
      };
    case types.REGISTER_FAIL:
      return {
        ...state,
        registering: false,
        user: null,
        fail: action.error
      };
    case types.LOGOUT:
      return {
        ...state,
        loggingOut: true
      };
    case types.LOGOUT_SUCCESS:
      return {
        ...state,
        loggingOut: false,
        user: null,
        verified: false
      };
    case types.LOGOUT_FAIL:
      return {
        ...state,
        loggingOut: false,
        logoutError: action.error
      };
    case types.UPDATE_BALANCE:
      return {
        ...state,
        user: {
          ...state.user,
          balance: action.balance
        }
      };
    default:
      return state;
  }
}
