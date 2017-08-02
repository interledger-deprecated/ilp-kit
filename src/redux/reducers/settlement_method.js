import * as types from '../actionTypes'

const initialState = {
  loading: true,
  loaded: false,
  list: [],
  destination: {}
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_SETTLEMENT_METHODS:
      return {
        ...state,
        loading: true,
        loaded: false
      }
    case types.LOAD_SETTLEMENT_METHODS_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        list: action.result
      }
    case types.LOAD_SETTLEMENT_METHODS_FAIL:
      return {
        ...state,
        loading: false,
        loaded: true
      }
    case types.ADD_SETTLEMENT_METHOD_SUCCESS:
      return {
        ...state,
        list: [action.result].concat(state.list)
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
    case types.GET_DESTINATION_SUCCESS:
      return {
        ...state,
        destination: action.result
      }
    default:
      return state
  }
}
