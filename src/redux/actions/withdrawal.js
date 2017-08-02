import uuid from 'uuid4'
import * as types from '../actionTypes'

export const load = () => ({
  types: [types.LOAD_WITHDRAWALS, types.LOAD_WITHDRAWALS_SUCCESS, types.LOAD_WITHDRAWALS_FAIL],
  promise: (client) => client.get('/withdrawals')
})

export const update = (id, data) => ({
  types: [types.UPDATE_WITHDRAWAL, types.UPDATE_WITHDRAWAL_SUCCESS, types.UPDATE_WITHDRAWAL_FAIL],
  promise: (client) => client.put(`/withdrawals/${id}`, { data })
})

export const withdraw = amount => ({
  types: [types.WITHDRAW, types.WITHDRAW_SUCCESS, types.WITHDRAW_FAIL],
  promise: client => client.post(`/withdrawals/${uuid()}`, { data: { amount } })
})
