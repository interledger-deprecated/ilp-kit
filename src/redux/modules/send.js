const SENDING = 'redux-example/send/SENDING';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';
const SEND_FAIL = 'redux-example/send/SEND_FAIL';

const initialState = {
  success: false,
  fail: ''
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SENDING:
      return {
        ...state,
        success: false,
        fail: ''
      };
    case SEND_SUCCESS:
      return {
        ...state,
        success: true,
        fail: ''
      };
    case SEND_FAIL:
      return {
        ...state,
        success: false,
        fail: action.error.message
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
