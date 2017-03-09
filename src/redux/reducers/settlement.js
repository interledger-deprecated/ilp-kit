import * as types from '../actionTypes'

const initialState = {
  info: {}
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.GET_SETTLEMENT_SUCCESS:
      return {
        ...state,
        info: action.result
      }
    default:
      return state
  }
}
