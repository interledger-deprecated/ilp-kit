import * as types from '../actionTypes';

const initialState = {
  fail: {},
  quote: {},
  quoting: false,
  destinationInfo: {}
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.DESTINATION_CHANGE_SUCCESS:
      // TODO handle the affect this has on source/destination amounts and quoting
      return {
        ...state,
        fail: {},
        destinationInfo: action.result
      }
    case types.DESTINATION_CHANGE_FAIL:
      return {
        ...state,
        fail: action.error,
        destinationInfo: {}
      }
    case types.REQUEST_QUOTE:
      return {
        ...state,
        quote: {},
        quoting: true,
        fail: {}
      };
    case types.REQUEST_QUOTE_SUCCESS:
      if (action.result && action.result.debits) {
        return {
          ...state,
          quote: action.result,
          quoting: false
        };
      }

      return {
        ...state,
        quote: action.result,
        quoting: false,
        fail: {}
      };
    case types.REQUEST_QUOTE_FAIL:
      return {
        ...state,
        quote: {},
        quoting: false,
        fail: action.error
      };
    case types.SEND:
      return {
        ...state,
        fail: {}
      };
    case types.SEND_SUCCESS:
      return {
        ...state,
        fail: {},
        quote: {}
      };
    case types.SEND_FAIL:
      return {
        ...state,
        fail: action.error
      };
    case types.DESTROY:
      return initialState;
    default:
      return state;
  }
}
