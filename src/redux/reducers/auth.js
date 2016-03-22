import * as types from '../actionTypes'

export const initialState = {
  loaded: false,
  fail: {},
  config: {},
  activeTab: 'login'
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
        user: action.result
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
        user: null
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
    case types.AUTH_CHANGE_TAB:
      return {
        ...state,
        activeTab: action.tab
      };
    case types.DESTROY:
      return {
        ...state,
        fail: {}
      };
    default:
      return state;
  }
}
