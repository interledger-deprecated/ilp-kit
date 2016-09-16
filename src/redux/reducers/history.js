import * as types from '../actionTypes'
import moment from 'moment-timezone'

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
      // Only do these things when the user is on the first page
      if (state.currentPage !== 1) return state

      // Try to fit in a group
      let didItFit
      const timeSlot = moment(action.result.created_at).tz('UTC').startOf('hour').format('YYYY-MM-DD HH:mm:ss')

      // Go thru the existing groups
      let newList = state.list.map((item) => {
        // Is this group in the same time slot as the new payment?
        if (timeSlot !== item.time_slot) return item

        // Are the source and destination accounts the same with the new payment?
        if (action.result.source_account !== item.source_account
          || action.result.destination_account !== item.destination_account) {
          return item
        }

        // ok good, now add the new payment to the group
        const newGroup = {
          ...item,
          time_slot: timeSlot,
          recent_date: action.result.created_at,
          transfers_count: (item.transfers_count || 1) + 1,
          source_amount: item.source_amount + action.result.source_amount,
          destination_amount: item.destination_amount + action.result.destination_amount
        }

        // payment found a group to join
        didItFit = true

        // add the payment to transfers list
        if (newGroup.transfers && newGroup.transfers.length > 0) {
          newGroup.transfers.unshift(action.result)
        }

        return newGroup
      })

      // New payment didn't find a group to join, add a new group
      if (!didItFit) {
        newList = [{
          ...action.result,
          time_slot: timeSlot,
          recent_date: action.result.created_at
        }].concat(newList)
      }

      // Remove the last payment on the first page.
      if (state.totalPages > 1) {
        newList.pop()
      }

      return {
        ...state,
        list: newList
      }
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
