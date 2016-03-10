import reducer from './auth'
import Helper from '../../../test/helpers/reducer'
import {initialState} from './auth'
import * as types from '../actionTypes'

const helper = new Helper(reducer)

describe('(reducer) Auth', () => {
  it('return the initial state', () => {
    helper.test(undefined, undefined, {}, initialState)
  })

  it('handle UPDATE_BALANCE', () => {
    // Balance up
    helper.test(
      {user: {balance: 300}},
      types.UPDATE_BALANCE,
      {change: 1000},
      {user: {balance: 1300}}
    )

    // Balance down
    helper.test(
      {user: {balance: 300}},
      types.UPDATE_BALANCE,
      {change: -100},
      {user: {balance: 200}}
    )
  })
})