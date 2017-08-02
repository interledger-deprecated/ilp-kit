import _ from 'lodash'
import * as types from '../actionTypes'

export const load = () => ({
  types: [types.LOAD_SETTLEMENT_METHODS, types.LOAD_SETTLEMENT_METHODS_SUCCESS, types.LOAD_SETTLEMENT_METHODS_FAIL],
  promise: (client) => client.get('/settlement_methods')
})

export const get = id => (dispatch, getState) => dispatch(() => {
  const list = getState().settlementMethod.list

  // List is already loaded
  if (list.length) return Promise.resolve(_.find(list, { id }))

  // Load the list first
  return dispatch(load())
    .then(loadedList => {
      return _.find(loadedList, { id })
    })
})

export const add = data => ({
  types: [types.ADD_SETTLEMENT_METHOD, types.ADD_SETTLEMENT_METHOD_SUCCESS, types.ADD_SETTLEMENT_METHOD_FAIL],
  promise: client => client.post('/settlement_methods', {data})
})

export const update = (id, data) => ({
  types: [types.UPDATE_SETTLEMENT_METHOD, types.UPDATE_SETTLEMENT_METHOD_SUCCESS, types.UPDATE_SETTLEMENT_METHOD_FAIL],
  promise: client => client.put(`/settlement_methods/${id}`, {data})
})

export const updateLogo = result => ({
  type: types.UPDATE_SETTLEMENT_METHOD_PIC,
  result
})

export const remove = id => ({
  types: [types.REMOVE_SETTLEMENT_METHOD, types.REMOVE_SETTLEMENT_METHOD_SUCCESS, types.REMOVE_SETTLEMENT_METHOD_FAIL],
  promise: client => client.del(`/settlement_methods/${id}`)
})

export const settle = (destination, data) => ({
  types: [types.SETTLE, types.SETTLE_SUCCESS, types.SETTLE_FAIL],
  promise: client => client.post(`/settlements/${destination}/paypal`, { data })
})

export const getDestination = destination => ({
  types: [types.GET_DESTINATION, types.GET_DESTINATION_SUCCESS, types.GET_DESTINATION_FAIL],
  promise: client => client.get(`/destinations/${destination}`)
})
