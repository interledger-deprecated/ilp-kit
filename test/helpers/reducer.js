import {expect} from 'chai'

export default class {
  constructor (reducer) {
    this.reducer = reducer
  }

  test (state, type, action, result) {
    let typeLine = type ? {type: type} : {}
    expect(this.reducer(state, {...action, ...typeLine})).eql(result)
  }
}