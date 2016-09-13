import * as types from '../actionTypes'
import moment from 'moment'

import paginate from 'redux-pagination'

function reducer(state = {}, action = {}) {
  function updateInHistory(timeSlot, update) {
    return {
      ...state,
      list: state.list.map(payment => {
        if (payment.time_slot === timeSlot) {
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
        if (state.totalPages > 1) {
          // remove the last payment
          state.list.pop()
        }

        // Try to fit in a group
        let didItFit

        let newList = state.list.map((item) => {
          // Need to put it in the same time slot
          if (action.result.time_slot !== item.time_slot) return item

          // source and destination accounts need to be the same
          if (action.result.source_account !== item.source_account
            || action.result.destination_account !== item.destination_account) {
            return item
          }

          // Oh yea
          didItFit = true

          return {
            ...item,
            transfers_count: (item.transfers_count || 1) + 1,
            source_amount: item.source_amount + action.result.source_amount,
            destination_amount: item.destination_amount + action.result.destination_amount
          }
        })

        // Make it an individual payment
        if (!didItFit) {
          newList = [action.result].concat(newList)
        }

        return {
          ...state,
          // Add the new payment
          list: newList
        }
      }

      return state
    case types.LOGOUT_SUCCESS:
      return {}
    case types.LOAD_TRANSFERS:
      return updateInHistory(action.timeSlot, {
        transfersLoading: true
      })
    case types.LOAD_TRANSFERS_SUCCESS:
      return updateInHistory(action.timeSlot, {
        transfers: action.result,
        transfersLoading: false
      })
    case types.LOAD_TRANSFERS_FAIL:
      return updateInHistory(action.timeSlot, {
        transfersLoading: false
      })
    default:
      return state
  }
}

export default paginate(reducer, {limit: 20})
