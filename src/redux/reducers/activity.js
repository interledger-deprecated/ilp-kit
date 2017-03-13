import * as types from '../actionTypes'
import moment from 'moment-timezone'

import paginate from 'redux-pagination'

function reducer (state = {}, action = {}) {
  switch (action.type) {
    case types.WS_PAYMENT:
      // Only do these things when the user is on the first page
      if (state.currentPage !== 1) return state

      // Try to fit in a group
      let didItFit
      const timeSlot = moment(action.result.created_at)
        .tz('UTC')
        .startOf('hour')
        .format('YYYY-MM-DD[T]HH:mm:ss.000[Z]')

      // Go thru the existing groups
      let newList = state.list.map((item) => {
        // Is this group in the same time slot as the new payment?
        // TODO:BEFORE_DEPLOY handle this
        if (timeSlot !== item.time_slot) return item

        // Are the source and destination identifiers the same with the new payment?
        if (action.result.source_identifier !== item.source_identifier
          || action.result.destination_identifier !== item.destination_identifier) {
          return item
        }

        // Is message the same?
        if (action.result.message !== item.message) return item

        // ok good, now add the new payment to the group
        const newGroup = {
          ...item,
          recent_date: action.result.created_at,
          transfers_count: (+item.transfers_count || 1) + 1,
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

      // Remove the last payment on the first page if a new payment group has been created
      if (state.totalPages > 1 && !didItFit) {
        newList.pop()
      }

      return {
        ...state,
        list: newList
      }
    case types.LOGOUT_SUCCESS:
      return {}
    default:
      return state
  }
}

export default paginate(reducer, {limit: 20})
