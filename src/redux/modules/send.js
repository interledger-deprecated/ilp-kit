import uuid4 from 'uuid4';

const SENDING = 'redux-example/send/SENDING';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';
const SEND_FAIL = 'redux-example/send/SEND_FAIL';
const DESTROY = 'redux-example/send/DESTROY';

const initialState = {
  success: false,
  fail: {}
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
        fail: {}
      };
    case SEND_FAIL:
      return {
        ...state,
        success: false,
        fail: JSON.parse(action.error.response.text)
      };
    case DESTROY:
      return {
        ...state,
        success: false,
        fail: {}
      };
    default:
      return state;
  }
}

export function transfer(values) {
  return {
    types: [SENDING, SEND_SUCCESS, SEND_FAIL],
    promise: (client) => client.put('/payments/' + uuid4(), {
      data: {
        destination_user: values.recipient,
        source_amount: values.amount,
        destination_amount: values.amount
      }
    })
  };
}

// TODO there's gotta be a way to automate this somehow (fallback to default state)
export function unmount() {
  return {
    type: DESTROY
  };
}
