import * as types from '../actionTypes'

export const check = enabled => ({
  type: types.WEBPAYMENTS_CHECK,
  enabled
})
