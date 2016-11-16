import {createValidator, required, integer, number, minValue} from 'utils/validation';

const sendValidation = createValidator({
  destination: [required],
  // TODO number validation
  sourceAmount: [required, number],
  destinationAmount: [required, number],
  repeats: [integer],
  interval: [integer, minValue(200)]
});
export default sendValidation;
