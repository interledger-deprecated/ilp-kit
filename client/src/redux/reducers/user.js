import * as types from '../actionTypes'

const initialState = {
  users: [],
  loaded: false,
  user: {}
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_USERS_SUCCESS:
      return {
        ...state,
        users: action.result.map(user => {
          return {
            ...user,
            balance: parseFloat(user.balance),
            loaded: true
          }
        }),
        loaded: true
      }
    case types.LOAD_USERS_FAIL:
      return {
        ...state,
        loaded: true
      }
    case types.GET_USER_SUCCESS:
      return {
        ...state,
        user: action.result
      }
    default:
      return state
  }
}
