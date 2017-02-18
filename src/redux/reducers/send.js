import * as types from '../actionTypes'

const initialState = {
  quote: {},
  err: {},
  quoting: false,
  destinationInfo: {},
  sourceAmount: null,
  destinationAmount: null
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.DESTINATION_CHANGE:
      return {
        ...state,
        err: {},
        quoteError: null
      }
    case types.DESTINATION_CHANGE_SUCCESS:
      return {
        ...state,
        destinationInfo: action.result
      }
    case types.DESTINATION_CHANGE_FAIL:
    case types.DESTINATION_RESET:
      return {
        ...state,
        destinationInfo: {}
      }
    case types.AMOUNTS_CHANGE:
      return {
        ...state,
        sourceAmount: action.sourceAmount,
        destinationAmount: action.destinationAmount
      }
    case types.REQUEST_QUOTE:
      return {
        ...state,
        quote: {},
        quoting: true,
        quoteError: null
      }
    case types.REQUEST_QUOTE_SUCCESS:
      return {
        ...state,
        quote: action.result,
        quoting: false,
        sourceAmount: action.result.sourceAmount,
        destinationAmount: action.result.destinationAmount,
        quoteError: {}
      }
    case types.REQUEST_QUOTE_FAIL:
      return {
        ...state,
        quote: {},
        quoting: false,
        quoteError: action.error
      }
    case types.SEND_RESET:
      return {
        ...state,
        quote: {},
        destinationInfo: {},
        quoteError: null
      }
    case types.SEND_FAIL:
      return {
        ...state,
        err: action.error
      }
    case types.DESTROY:
      return initialState
    default:
      return state
  }
}
