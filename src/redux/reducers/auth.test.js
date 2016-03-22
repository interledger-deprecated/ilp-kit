import reducer from './auth'
import Helper from '../../../test/helpers/reducer'
import {initialState} from './auth'
import * as types from '../actionTypes'

const helper = new Helper(reducer)

describe('(reducer) Auth', () => {
  it('return the initial state', () => {
    helper.test(undefined, undefined, {}, initialState)
  })
})