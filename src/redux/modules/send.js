const SENDING = 'redux-example/send/SENDING';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';
const SEND_FAIL = 'redux-example/send/SEND_FAIL';

const initialState = {
  sending: false,
  success: false,
  error: false
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SENDING:
      return {
        ...state,
        sending: true,
        success: false,
        error: false
      };
    case SEND_SUCCESS:
      return {
        ...state,
        sending: false,
        success: true,
        error: false
      };
    case SEND_FAIL:
      return {
        ...state,
        sending: false,
        success: false,
        error: action.error
      };
    default:
      return state;
  }
}

export function transfer(recipient, amount, password) {
  return {
    types: [SENDING, SEND_SUCCESS, SEND_FAIL],
    promise: (client) => client.post('/send', {
      data: {
        recipient: recipient,
        amount: amount,
        password: password
      }
    })
  };
}
