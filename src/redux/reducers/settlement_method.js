import * as types from '../actionTypes'

const initialState = {
  list: []
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_SETTLEMENT_METHODS_SUCCESS:
      return {
        ...state,
        list: action.result
      }
    case types.ADD_SETTLEMENT_METHOD_SUCCESS:
      return {
        ...state,
        list: state.list.concat(action.result)
      }
    case types.UPDATE_SETTLEMENT_METHOD_SUCCESS:
      return {
        ...state,
        list: state.list.map(settlementMethod => {
          if (settlementMethod.id !== action.result.id) return settlementMethod

          return action.result
        })
      }
    case types.UPDATE_SETTLEMENT_METHOD_PIC:
      return {
        ...state,
        list: state.list.map(settlementMethod => {
          if (settlementMethod.id !== action.result.id) return settlementMethod

          return action.result
        })
      }
    case types.REMOVE_SETTLEMENT_METHOD_SUCCESS:
      return {
        ...state,
        list: state.list.filter(settlementMethod => settlementMethod.id !== action.result.id)
      }
    default:
      return state
  }
}
