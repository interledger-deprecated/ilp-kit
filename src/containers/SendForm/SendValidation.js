import {createValidator, required, integer, number, minValue, lessThanBalance} from 'utils/validation'

const sendValidation = (values, props) => {
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

  // TODO what if it's not -infinity but some other number
  if (props.user.minimum_allowed_balance !== '-infinity') {
    sourceAmountValidators.push(lessThanBalance(props.user.balance))
  }

  return createValidator({
    destination: [required],
    // TODO number validation
    sourceAmount: sourceAmountValidators,
    destinationAmount: [required, number],
    repeats: [integer],
    interval: [integer, minValue(200)]
  })(values, props)
}
export default sendValidation
