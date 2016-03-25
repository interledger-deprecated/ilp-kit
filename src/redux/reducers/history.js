import * as types from '../actionTypes'

import paginate from 'redux-pagination'

function reducer(state = {}, action = {}) {
  function updateInHistory(paymentId, update) {
    return {
      ...state,
      list: state.list.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            ...update
          }
        }

        return payment
      })
    }
  }

  switch (action.type) {
    // case PAYMENT_JSON_LOADING
    // case PAYMENT_JSON_FAIL
    case types.PAYMENT_JSON_SUCCESS:
      return updateInHistory(action.id, {
        showJson: true,
        json: action.result
      })
    case types.PAYMENT_JSON_SHOW:
      return updateInHistory(action.id, {showJson: true})
    case types.PAYMENT_JSON_HIDE:
      return updateInHistory(action.id, {showJson: false})
    case types.WS_PAYMENT:
      if (state.currentPage === 1) {
        // remove the last payment
        state.list.pop()

        return {
          ...state,
          // Add the new payment
          list: [action.result].concat(state.list)
        }
      }

      return state
    case types.LOGOUT_SUCCESS:
      return {}
    default:
      return state
  }
}

export default paginate(reducer, {limit: 20})
