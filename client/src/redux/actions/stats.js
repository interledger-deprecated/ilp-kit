import * as types from '../actionTypes'

export const loadStats = () => {
  return {
    types: [types.LOAD_STATS, types.LOAD_STATS_SUCCESS, types.LOAD_STATS_FAIL],
    promise: (client) => client.get('/payments/stats')
  }
}
