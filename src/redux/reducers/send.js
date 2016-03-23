import * as types from '../actionTypes';

const initialState = {
  success: false,
  fail: {},
  path: {},
  pathFinding: false,
  destinationInfo: {},
  pathRaw: {}
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.DESTINATION_CHANGE_SUCCESS:
      // TODO handle the affect this has on source/destination amounts and pathfinding
      return {
        ...state,
        destinationInfo: action.result
      }
    case types.DESTINATION_CHANGE_FAIL:
      return {
        ...state,
        fail: action.error,
        destinationInfo: {}
      }
    case types.PATHFIND:
      return {
        ...state,
        path: {},
        pathRaw: {},
        pathFinding: true,
        fail: {}
      };
    case types.PATHFIND_SUCCESS:
      if (action.result.length && action.result[0].source_transfers) {
        return {
          ...state,
          path: {
            sourceAmount: action.result[0].source_transfers[0].debits[0].amount,
            destinationAmount: action.result[0].destination_transfers[0].debits[0].amount
          },
          pathRaw: action.result,
          pathFinding: false
        };
      }

      return {
        ...state,
        path: action.result,
        pathRaw: action.result,
        pathFinding: false,
        fail: {}
      };
    case types.PATHFIND_FAIL:
      return {
        ...state,
        path: {},
        pathRaw: {},
        pathFinding: false,
        fail: action.error
      };
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
    case types.DESTROY:
      return initialState;
    default:
      return state;
  }
}
