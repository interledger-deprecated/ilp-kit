import {createValidator, required, integer, minValue} from 'utils/validation';

const sendValidation = createValidator({
  destination: [required],
  // TODO number validation
  sourceAmount: [required],
  destinationAmount: [required],
  repeats: [integer],
  interval: [integer, minValue(200)]
});
export default sendValidation;
