import {createValidator, required, integer, number, minValue, lessThanBalance} from 'utils/validation'

const sendValidation = (values, props) => {
  const sourceAmountValidators = [required, number, minValue(0.001)]

  if (!props.user.isAdmin) {
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
