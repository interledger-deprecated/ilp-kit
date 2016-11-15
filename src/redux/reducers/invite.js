import * as types from '../actionTypes'

const initialState = {
  codes: [],
  invite: {}
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_INVITES_SUCCESS:
      return {
        ...state,
        codes: action.result
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
        codes: [action.result].concat(state.codes)
      }
    case types.REMOVE_INVITE_SUCCESS:
      return {
        ...state,
        codes: state.codes.filter(invite => invite.code !== action.result.code)
      }
    default:
      return state
  }
}
