import * as types from '../actionTypes'

export const load = () => ({
  types: [types.LOAD_RECEIVERS, types.LOAD_RECEIVERS_SUCCESS, types.LOAD_RECEIVERS_FAIL],
  promise: (client) => client.get('/receivers')
})

export const add = data => ({
  types: [types.ADD_RECEIVER, types.ADD_RECEIVER_SUCCESS, types.ADD_RECEIVER_FAIL],
  promise: (client) => client.post('/receivers', {data})
})

export const update = (name, data) => ({
  types: [types.UPDATE_RECEIVER, types.UPDATE_RECEIVER_SUCCESS, types.UPDATE_RECEIVER_FAIL],
  promise: (client) => client.put('/receivers/' + name, {data})
})

export const remove = name => ({
  types: [types.REMOVE_RECEIVER, types.REMOVE_RECEIVER_SUCCESS, types.REMOVE_RECEIVER_FAIL],
  promise: (client) => client.del('/receivers/' + name)
})
