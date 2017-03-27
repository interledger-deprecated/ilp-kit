import * as types from '../actionTypes'

const initialState = {
  info: {},
  list: []
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_WITHDRAWALS_SUCCESS:
      return {
        ...state,
        list: action.result
      }
    case types.UPDATE_WITHDRAWAL_SUCCESS:
      return {
        ...state,
        list: state.list.map(withdrawal => {
          if (withdrawal.id !== action.result.id) return withdrawal

          return {
            ...withdrawal,
            ...action.result
          }
        })
      }
    case types.WITHDRAW_SUCCESS:
      return {
        ...state
      }
    default:
      return state
  }
}
