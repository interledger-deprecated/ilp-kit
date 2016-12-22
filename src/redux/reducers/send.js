import * as types from '../actionTypes'

const initialState = {
  quote: {},
  err: {},
  quoting: false,
  destinationInfo: {},
  sourceAmount: null,
  destinationAmount: null
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.DESTINATION_CHANGE:
      return {
        ...state,
        err: {}
      }
    case types.DESTINATION_CHANGE_SUCCESS:
      return {
        ...state,
        destinationInfo: action.result
      }
    case types.DESTINATION_CHANGE_FAIL:
      return {
        ...state,
        destinationInfo: {},
        err: action.error
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
        quoting: true
      }
    case types.REQUEST_QUOTE_SUCCESS:
      return {
        ...state,
        quote: action.result,
        quoting: false,
        sourceAmount: action.result.sourceAmount,
        destinationAmount: action.result.destinationAmount,
        err: {}
      }
    case types.REQUEST_QUOTE_FAIL:
      return {
        ...state,
        quote: {},
        quoting: false,
        err: action.error
      }
    case types.SEND_RESET:
      return {
        ...state,
        quote: {},
        destinationInfo: {}
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
