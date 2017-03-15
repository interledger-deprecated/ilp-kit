import * as types from '../actionTypes'

import paginate from 'redux-pagination'

function reducer (state = {}, action = {}) {
  switch (action.type) {
    case types.WS_ACTIVITY:
      // Only do these things when the user is on the first page
      // TODO ^ is the above comment still relevant?
      if (state.currentPage !== 1) return state

      return {
        ...state,
        list: [action.result].concat(state.list)
      }
    case types.LOGOUT_SUCCESS:
      return {}
    default:
      return state
  }
}

export default paginate(reducer, {limit: 20})
