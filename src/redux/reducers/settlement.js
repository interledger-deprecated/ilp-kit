import * as types from '../actionTypes'

const initialState = {
  info: {},
  user: {
    list: []
  },
  peer: {
    list: []
  }
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.GET_SETTLEMENT_SUCCESS:
      return {
        ...state,
        info: action.result
      }
    case types.GET_SETTLEMENTS_SUCCESS:
      // TODO bit messy?
      if (action.result.length > 0 && action.result[0].user_id) {
        return {
          ...state,
          user: {
            list: action.result
          }
        }
      }

      // TODO:BEFORE_DEPLOY do the peer type too

    default:
      return state
  }
}
