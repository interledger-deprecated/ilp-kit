import * as types from '../actionTypes'

const initialState = {
  enabled: false
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.WEBPAYMENTS_CHECK:
      return {
        ...state,
        enabled: action.enabled
      }
    default:
      return state
  }
}
