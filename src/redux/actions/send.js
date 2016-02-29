import uuid4 from 'uuid4';
import * as types from '../actionTypes';

export function findPath(values) {
  return {
    types: [types.PATHFIND, types.PATHFIND_SUCCESS, types.PATHFIND_FAIL],
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
      types: [types.SEND, types.SEND_SUCCESS, types.SEND_FAIL],
      promise: (client) => client.put('/payments/' + uuid4(), {
        // TODO source user set here or in api?
        data: {
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
    type: types.DESTROY
  };
}
