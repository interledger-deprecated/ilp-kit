import * as types from '../actionTypes'

const initialState = {
  list: [],
  loading: true,
  loaded: false,
  invite: {}
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_INVITES:
      return {
        ...state,
        loading: true,
        loaded: false
      }
    case types.LOAD_INVITES_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        list: action.result
      }
    case types.LOAD_INVITES_FAIL:
      return {
        ...state,
        loading: false,
        loaded: true
      }
    case types.LOAD_INVITE:
      return {
        ...state,
        loading: true
      }
    case types.LOAD_INVITE_SUCCESS:
      return {
        ...state,
        invite: action.result,
        loading: false
      }
    case types.LOAD_INVITE_FAIL:
      return {
        ...state,
        loading: false
        // TODO:UX specify the error
      }
    case types.CREATE_INVITE_SUCCESS:
      return {
        ...state,
        list: [action.result].concat(state.list)
      }
    case types.REMOVE_INVITE_SUCCESS:
      return {
        ...state,
        list: state.list.filter(invite => invite.code !== action.result.code)
      }
    default:
      return state
  }
}
