import * as types from '../actionTypes'

const initialState = {
  quote: {},
  quoting: false,
  destinationInfo: {}
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.DESTINATION_CHANGE_SUCCESS:
      // TODO handle the affect this has on source/destination amounts and quoting
      return {
        ...state,
        destinationInfo: action.result
      }
    case types.DESTINATION_CHANGE_FAIL:
      return {
        ...state,
        destinationInfo: {}
      }
    case types.REQUEST_QUOTE:
      return {
        ...state,
        quote: {},
        quoting: true
      }
    case types.REQUEST_QUOTE_SUCCESS:
      if (action.result && action.result.debits) {
        return {
          ...state,
          quote: action.result,
          quoting: false
        }
      }

      return {
        ...state,
        quote: action.result,
        quoting: false
      }
    case types.REQUEST_QUOTE_FAIL:
      return {
        ...state,
        quote: {},
        quoting: false
      }
    case types.SEND_SUCCESS:
      return {
        ...state,
        quote: {},
        destinationInfo: {}
      }
    case types.DESTROY:
      return initialState
    default:
      return state
  }
}
