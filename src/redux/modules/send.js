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
        fail: action.error
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
    promise: (client) => client.post('/send', {
      data: {
        recipient: values.recipient,
        amount: values.amount
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
