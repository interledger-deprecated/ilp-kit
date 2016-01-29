const LOAD = 'redux-example/history/LOAD';
const LOAD_SUCCESS = 'redux-example/history/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/history/LOAD_FAIL';
const PAYMENT_JSON_LOADING = 'redux-example/history/PAYMENT_JSON_LOADING';
const PAYMENT_JSON_SUCCESS = 'redux-example/history/PAYMENT_JSON_SUCCESS';
const PAYMENT_JSON_FAIL = 'redux-example/history/PAYMENT_JSON_FAIL';
const PAYMENT_JSON_SHOW = 'redux-example/history/PAYMENT_JSON_SHOW';
const PAYMENT_JSON_HIDE = 'redux-example/history/PAYMENT_JSON_HIDE';
const SEND_SUCCESS = 'redux-example/send/SEND_SUCCESS';

const initialState = {
  success: false,
  history: [],
  fail: {}
};

export default function reducer(state = initialState, action = {}) {
  function updateInHistory(paymentId, update) {
    return {
      ...state,
      history: state.history.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            ...update
          };
        }

        return payment;
      })
    };
  }

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
      return updateInHistory(action.id, {
        showJson: true,
        json: action.result
      });
    case PAYMENT_JSON_SHOW:
      return updateInHistory(action.id, {showJson: true});
    case PAYMENT_JSON_HIDE:
      return updateInHistory(action.id, {showJson: false});
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
export function toggleJson(id, transfer) {
  return (dispatch, getState) => {
    const payment = getState().history.history.filter((item) => {
      return item.id === id;
    })[0];

    // Hide the json
    if (payment.showJson) {
      return dispatch({
        type: PAYMENT_JSON_HIDE,
        id
      });
    } else if (payment.json) { // Show the json
      return dispatch({
        type: PAYMENT_JSON_SHOW,
        id
      });
    }

    // Load the json
    return dispatch({
      types: [PAYMENT_JSON_LOADING, PAYMENT_JSON_SUCCESS, PAYMENT_JSON_FAIL],
      promise: (client) => client.get(transfer),
      id
    });
  };
}

export function load() {
  return {
    types: [LOAD, LOAD_SUCCESS, LOAD_FAIL],
    promise: (client) => client.get('/payments')
  };
}
