import {createValidator, required, integer, number, minValue, lessThanBalance} from 'utils/validation'

const sendValidation = (values, props) => {
  return createValidator({
    destination: [required],
    // TODO number validation
    sourceAmount: [required, number, lessThanBalance(props.user.balance)],
    destinationAmount: [required, number],
    repeats: [integer],
    interval: [integer, minValue(200)]
  })(values, props)
}
export default sendValidation
