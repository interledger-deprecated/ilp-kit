import * as types from '../actionTypes'

const initialState = {
  info: {}
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.WITHDRAW_SUCCESS:
      return {
        ...state
      }
    default:
      return state
  }
}
