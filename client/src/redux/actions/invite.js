import * as types from '../actionTypes'

export const loadCode = (code) => ({
  types: [types.LOAD_INVITE, types.LOAD_INVITE_SUCCESS, types.LOAD_INVITE_FAIL],
  promise: (client) => client.get('/invites/' + code)
})

export const loadCodes = () => ({
  types: [types.LOAD_INVITES, types.LOAD_INVITES_SUCCESS, types.LOAD_INVITES_FAIL],
  promise: (client) => client.get('/invites')
})

export const create = (data) => ({
  types: [types.CREATE_INVITE, types.CREATE_INVITE_SUCCESS, types.CREATE_INVITE_FAIL],
  promise: (client) => client.post('/invites', {data})
})

export const remove = (code) => ({
  types: [types.REMOVE_INVITE, types.REMOVE_INVITE_SUCCESS, types.REMOVE_INVITE_FAIL],
  promise: (client) => client.del('/invites/' + code)
})
