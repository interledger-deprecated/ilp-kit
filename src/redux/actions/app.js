import * as types from '../actionTypes'

export const doSomething = () => ({
  types: [types.DO_SOMETHING, types.DO_SOMETHING_SUCCESS, types.DO_SOMETHING_FAIL],
  promise: client => client.get('/doSomething')
})
