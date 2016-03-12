import {expect} from 'chai'

// TODO explore intern.js for tests
export default class {
  constructor (reducer) {
    this.reducer = reducer
  }

  test (state, type, action, result) {
    let typeLine = type ? {type: type} : {}
    expect(this.reducer(state, {...action, ...typeLine})).eql(result)
  }
}
