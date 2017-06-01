import * as types from '../actionTypes'

const initialState = {
  receivers: []
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_RECEIVERS_SUCCESS:
      return {
        ...state,
        receivers: action.result
      }
    case types.ADD_RECEIVER_SUCCESS:
      return {
        ...state,
        receivers: [action.result].concat(state.receivers)
      }
    case types.UPDATE_RECEIVER_SUCCESS:
      return {
        ...state,
        receivers: state.receivers.map(receiver => {
          if (receiver.name !== action.result.name) return receiver

          return action.result
        })
      }
    case types.REMOVE_RECEIVER_SUCCESS:
      return {
        ...state,
        receivers: state.receivers.filter(receiver => receiver.name !== action.result.name)
      }
    default:
      return state
  }
}
