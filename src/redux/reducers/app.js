import * as types from '../actionTypes'

const app = (state = [], action) => {
  switch (action.type) {
    case types.DO_SOMETHING:
      return {
        ...state,
        doing: true
      }
    default:
      return state
  }
}

export default app
