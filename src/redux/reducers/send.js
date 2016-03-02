import * as types from '../actionTypes';

const initialState = {
  success: false,
  fail: {},
  path: {},
  pathRaw: {}
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.SEND:
      return {
        ...state,
        success: false,
        fail: {}
      };
    case types.SEND_SUCCESS:
      return {
        ...state,
        success: true,
        fail: {},
        path: {},
        pathRaw: {}
      };
    case types.SEND_FAIL:
      return {
        ...state,
        success: false,
        fail: action.error
      };
    // TODO Handle findPath fail
    case types.PATHFIND_SUCCESS:
      if (action.result.length && action.result[0].source_transfers) {
        return {
          ...state,
          path: {
            sourceAmount: action.result[0].source_transfers[0].debits[0].amount,
            destinationAmount: action.result[0].destination_transfers[0].debits[0].amount
          },
          pathRaw: action.result
        };
      }

      return {
        ...state,
        path: action.result,
        pathRaw: action.result,
        fail: {}
      };
    case types.PATHFIND_FAIL:
      return {
        ...state,
        path: {},
        pathRaw: {},
        fail: action.error
      };
    case types.DESTROY:
      return initialState;
    default:
      return state;
  }
}
