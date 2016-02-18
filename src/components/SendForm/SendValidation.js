import {createValidator, required} from 'utils/validation';

const sendValidation = createValidator({
  destination: [required],
  // TODO number validation
  sourceAmount: [required],
  destinationAmount: [required]
});
export default sendValidation;
