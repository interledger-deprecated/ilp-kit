import * as types from '../actionTypes'

const initialState = {
  users: []
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_USERS_SUCCESS:
      return {
        ...state,
        users: action.result.map(user => {
          return {
            ...user,
            balance: parseFloat(user.balance)
          }
        })
      }
    default:
      return state
  }
}
