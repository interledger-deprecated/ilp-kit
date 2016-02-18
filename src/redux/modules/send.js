import uuid4 from 'uuid4';

const SENDING = 'redux-example/send/SENDING';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';
const SEND_FAIL = 'redux-example/send/SEND_FAIL';

const PATHFINDING = 'redux-example/send/PATHFINDING';
const PATHFIND_SUCCESS = 'redux-example/send/PATHFIND_SUCCESS';
const PATHFIND_FAIL = 'redux-example/send/PATHFIND_FAIL';

const DESTROY = 'redux-example/send/DESTROY';

const initialState = {
  success: false,
  fail: {},
  path: {},
  pathRaw: {}
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SENDING:
      return {
        ...state,
        success: false,
        fail: {}
      };
    case SEND_SUCCESS:
      return {
        ...state,
        success: true,
        fail: {},
        path: {},
        pathRaw: {}
      };
    case SEND_FAIL:
      return {
        ...state,
        success: false,
        fail: action.error
      };
    // TODO Handle findPath fail
    case PATHFIND_SUCCESS:
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
        pathRaw: action.result
      };
    case DESTROY:
      return initialState;
    default:
      return state;
  }
}

export function findPath(values) {
  return {
    types: [PATHFINDING, PATHFIND_SUCCESS, PATHFIND_FAIL],
    promise: (client) => client.post('/payments/findPath', {
      // TODO source user set here or in api?
      data: {
        destination: values.destination,
        source_amount: values.sourceAmount,
        destination_amount: values.destinationAmount
      }
    })
  };
}

// TODO confirm findPath instead of using the sender.default
export function transfer(values) {
  return (dispatch, getState) => {
    return dispatch({
      types: [SENDING, SEND_SUCCESS, SEND_FAIL],
      promise: (client) => client.put('/payments/' + uuid4(), {
        // TODO source user set here or in api?
        data: {
          destination_user: values.destination,
          destination_account: values.destination,
          source_amount: values.sourceAmount,
          destination_amount: values.destinationAmount,
          path: getState().send.pathRaw
        }
      })
    });
  };
}

// TODO there's gotta be a way to automate this somehow (fallback to default state)
export function unmount() {
  return {
    type: DESTROY
  };
}
