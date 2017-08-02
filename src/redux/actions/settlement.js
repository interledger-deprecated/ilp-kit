import * as types from '../actionTypes'

export const get = id => ({
  types: [types.GET_SETTLEMENT, types.GET_SETTLEMENT_SUCCESS, types.GET_SETTLEMENT_FAIL],
  promise: client => client.get(`/settlements/${id}`)
})

export const getSettlements = type => ({
  types: [types.GET_SETTLEMENTS, types.GET_SETTLEMENTS_SUCCESS, types.GET_SETTLEMENTS_FAIL],
  promise: client => client.get(`/settlements/?type=${type}`)
})
