import * as types from '../actionTypes'

const initialState = {
  users: [],
  loaded: false
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
    default:
      return state
  }
}
