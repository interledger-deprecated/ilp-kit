import * as types from '../actionTypes'

const initialState = {
  loading: false,
  peers: []
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_PEERS:
      return {
        ...state,
        loading: true
      }
    case types.LOAD_PEERS_SUCCESS:
      return {
        ...state,
        loading: false,
        peers: action.result
      }
    case types.LOAD_PEERS_FAIL:
      return {
        ...state,
        loading: false
      }
    case types.ADD_PEER_SUCCESS:
      return {
        ...state,
        peers: [action.result].concat(state.peers)
      }
    case types.UPDATE_PEER_SUCCESS:
      return {
        ...state,
        peers: state.peers.map((peer) => {
          if (peer.id !== action.result.id) return peer

          return action.result
        })
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