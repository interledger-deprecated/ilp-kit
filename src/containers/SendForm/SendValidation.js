import { createValidator, required, integer, number, minValue, greaterThanMinBalance } from 'utils/validation'
import { destinationChange } from 'redux/actions/send'

export const validate = (values, props) => {
  // Destination
  const notSelf = (destination) => {
    if (destination === props.user.identifier || destination === props.user.username) {
      return 'So you want to send money to yourself?'
    }
  }

  // Source amount minimum
  const amountScale = props.config.amountScale
  let minAmount

  if (amountScale > 1) {
    minAmount = 0.0.toFixed(props.config.amountScale - 1) + 1
  } else if (amountScale === 1) {
    minAmount = 0.1
  } else if (amountScale === 0) {
    minAmount = 1
  }

  const sourceAmountValidators = [
    required,
    number,
    minValue(minAmount),
    greaterThanMinBalance(
      props.user.balance,
      props.user.minimum_allowed_balance)
  ]

  return createValidator({
    destination: [required, notSelf],
    sourceAmount: sourceAmountValidators,
    destinationAmount: [required, number],
    repeats: [integer],
    interval: [integer, minValue(200)]
  })(values, props)
}

export const asyncValidate = (values, dispatch) => {
  return dispatch(destinationChange(values.destination))
    .then(() => {
      // promise should resolve without a value to be considered valid
    })
    .catch(() => {
      /* eslint no-throw-literal: "off" */
      throw { destination: 'Account not found' }
    })
}
