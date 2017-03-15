import * as types from '../actionTypes'

// TODO shouldn't ask for transfer link
export const toggleJson = (id, transfer) => (dispatch, getState) => {
  const payment = getState().activity.list.filter((item) => {
    return item.id === id
  })[0]

  // Hide the json
  if (payment.showJson) {
    return dispatch({
      type: types.PAYMENT_JSON_HIDE,
      id
    })
  } else if (payment.json) { // Show the json
    return dispatch({
      type: types.PAYMENT_JSON_SHOW,
      id
    })
  }

  // Load the json
  return dispatch({
    types: [types.PAYMENT_JSON_LOADING, types.PAYMENT_JSON_SUCCESS, types.PAYMENT_JSON_FAIL],
    promise: (client) => client.get(transfer),
    id
  })
}

// TODO separate module for WS stuff?
export const addActivity = result => dispatch => {
  return dispatch({
    type: types.WS_ACTIVITY,
    result
  })
}
