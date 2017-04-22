import * as types from '../actionTypes'

const initialState = {
  list: []
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_STATS_SUCCESS:
      return {
        ...state,
        list: action.result
      }
    default:
      return state
  }
}
