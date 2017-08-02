import * as types from '../actionTypes'

export const getUser = destination => ({
  types: [types.GET_USER, types.GET_USER_SUCCESS, types.GET_USER_FAIL],
  promise: client => client.get('/parse/destination', { params: { destination } })
})

export const loadUsers = () => ({
  types: [types.LOAD_USERS, types.LOAD_USERS_SUCCESS, types.LOAD_USERS_FAIL],
  promise: client => client.get('/users')
})
