import * as types from '../actionTypes'
import uuid from 'uuid4'

const destinationCache = {}

export const destinationChange = destination => dispatch => {
  if (destinationCache[destination]) {
    return Promise.resolve(dispatch({
      type: types.DESTINATION_CHANGE_SUCCESS,
      result: destinationCache[destination]
    }))
  }

  return dispatch({
    types: [types.DESTINATION_CHANGE, types.DESTINATION_CHANGE_SUCCESS, types.DESTINATION_CHANGE_FAIL],
    promise: client => client.get('/parse/destination', { params: { destination } })
      .then(destinationInfo => {
        destinationCache[destination] = destinationInfo

        return destinationInfo
      })
  })
}

export const destinationReset = () => ({
  type: types.DESTINATION_RESET
})

export const amountsChange = (sourceAmount, destinationAmount) => ({
  type: types.AMOUNTS_CHANGE,
  sourceAmount,
  destinationAmount
})

export const requestQuote = values => ({
  types: [types.REQUEST_QUOTE, types.REQUEST_QUOTE_SUCCESS, types.REQUEST_QUOTE_FAIL],
  promise: client => client.post('/payments/quote', {
    data: {
      destination: values.destination,
      sourceAmount: values.sourceAmount,
      destinationAmount: values.destinationAmount
    }
  })
})

// TODO confirm findPath instead of using the sender.default
export const transfer = data => (dispatch, getState) => dispatch({
  types: [types.SEND, types.SEND_SUCCESS, types.SEND_FAIL],
  promise: client => client.put('/payments/' + uuid(), {
    data: {
      quote: {
        ...getState().send.quote,
        id: uuid()
      },
      message: data.message
    }
  })
})

export const reset = () => ({
  type: types.SEND_RESET
})

// TODO there's gotta be a way to automate this somehow (fallback to default state)
export const unmount = () => ({
  type: types.DESTROY
})
