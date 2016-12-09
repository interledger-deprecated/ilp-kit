import * as types from '../actionTypes'

const initialState = {
  peers: []
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_PEERS_SUCCESS:
      return {
        ...state,
        peers: action.result
      }
    case types.ADD_PEER_SUCCESS:
      return {
        ...state,
        peers: [action.result].concat(state.peers)
      }
    case types.REMOVE_PEER_SUCCESS:
      return {
        ...state,
        peers: state.peers.filter(peer => peer.id !== action.result.id)
      }
    default:
      return state
  }
}
