import { createValidator, required, integer, number, minValue, lessThanBalance } from 'utils/validation'
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

  const sourceAmountValidators = [required, number, minValue(minAmount)]

  // Source amount maximum
  // TODO what if it's not -infinity but some other number
  if (props.user.minimum_allowed_balance !== '-infinity') {
    sourceAmountValidators.push(lessThanBalance(props.user.balance))
  }

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
    .catch(() => {
      throw {destination: 'Account not found'}
    })
}
