import * as types from '../actionTypes'

export const loadUsers = () => ({
  types: [types.LOAD_USERS, types.LOAD_USERS_SUCCESS, types.LOAD_USERS_FAIL],
  promise: (client) => client.get('/users')
})
