import * as types from '../actionTypes';

const initialState = {
  success: false,
  loading: false,
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
    case types.HISTORY_LOAD:
      return {
        ...state,
        success: false,
        loading: true,
        history: [],
        fail: {}
      };
    case types.HISTORY_LOAD_SUCCESS:
      return {
        ...state,
        success: true,
        loading: false,
        history: action.result,
        fail: {}
      };
    case types.HISTORY_LOAD_FAIL:
      return {
        ...state,
        success: false,
        loading: false,
        history: [],
        fail: action.error
      };
    // case PAYMENT_JSON_LOADING
    // case PAYMENT_JSON_FAIL
    case types.PAYMENT_JSON_SUCCESS:
      return updateInHistory(action.id, {
        showJson: true,
        json: action.result
      });
    case types.PAYMENT_JSON_SHOW:
      return updateInHistory(action.id, {showJson: true});
    case types.PAYMENT_JSON_HIDE:
      return updateInHistory(action.id, {showJson: false});
    case types.WS_PAYMENT:
      return {
        ...state,
        history: [action.result].concat(state.history)
      };
    default:
      return state;
  }
}
