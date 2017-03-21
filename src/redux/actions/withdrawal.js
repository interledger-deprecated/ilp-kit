import uuid from 'uuid4'
import * as types from '../actionTypes'

export const withdraw = amount => ({
  types: [types.WITHDRAW, types.WITHDRAW_SUCCESS, types.WITHDRAW_FAIL],
  promise: client => client.post(`/withdrawals/${uuid()}`, { data: { amount } })
})
