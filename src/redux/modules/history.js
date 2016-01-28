const LOAD = 'redux-example/history/LOAD';
const LOAD_SUCCESS = 'redux-example/history/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/history/LOAD_FAIL';
const PAYMENT_JSON_LOADING = 'redux-example/history/PAYMENT_JSON_LOADING';
const PAYMENT_JSON_SUCCESS = 'redux-example/history/PAYMENT_JSON_SUCCESS';
const PAYMENT_JSON_FAIL = 'redux-example/history/PAYMENT_JSON_FAIL';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';

const initialState = {
  success: false,
  history: [],
  fail: {}
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        success: false,
        history: [],
        fail: {}
      };
    case LOAD_SUCCESS:
      return {
        ...state,
        success: true,
        history: action.result,
        fail: {}
      };
    case LOAD_FAIL:
      return {
        ...state,
        success: false,
        history: [],
        fail: action.error
      };
    // case PAYMENT_JSON_LOADING
    // case PAYMENT_JSON_FAIL
    case PAYMENT_JSON_SUCCESS:
      return {
        ...state,
        history: state.history.map(payment => {
          if (payment.id === action.id) {
            return {
              ...payment,
              showJson: true,
              json: action.result
            };
          }

          return payment;
        })
      };
    case SEND_SUCCESS:
      return {
        ...state,
        history: [action.result].concat(state.history)
      };
    default:
      return state;
  }
}

// TODO shouldn't ask for transfer link
export function showJson(id, transfer) {
  return {
    types: [PAYMENT_JSON_LOADING, PAYMENT_JSON_SUCCESS, PAYMENT_JSON_FAIL],
    promise: (client) => client.get(transfer),
    id
  };
}

export function load() {
  return {
    types: [LOAD, LOAD_SUCCESS, LOAD_FAIL],
    promise: (client) => client.get('/payments')
  };
}
