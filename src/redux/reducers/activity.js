import _ from 'lodash'
import * as types from '../actionTypes'

import paginate from 'redux-pagination'

function reducer (state = {}, action = {}) {
  switch (action.type) {
    case types.WS_ACTIVITY:
      // Only do these things when the user is on the first page
      // TODO ^ is the above comment still relevant?
      if (state.currentPage !== 1) return state

      const activityIndex = _.findIndex(state.list, activity => activity.id === action.result.id)

      let list
      if (activityIndex > -1) {
        list = state.list.slice()
        list.splice(activityIndex, 1, action.result)
      } else {
        list = [action.result].concat(state.list)
      }

      return {
        ...state,
        list
      }
    case types.LOGOUT_SUCCESS:
      return {}
    default:
      return state
  }
}

export default paginate(reducer, {limit: 20})
