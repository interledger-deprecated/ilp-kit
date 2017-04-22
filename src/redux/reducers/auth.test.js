import reducer, { initialState } from './auth'
import Helper from '../../../test/helpers/reducer'

const helper = new Helper(reducer)

describe('(reducer) Auth', () => {
  it('return the initial state', () => {
    helper.test(undefined, undefined, {}, initialState)
  })
})
