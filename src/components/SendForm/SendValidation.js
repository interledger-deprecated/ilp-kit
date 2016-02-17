import {createValidator, required, integer} from 'utils/validation';

const sendValidation = createValidator({
  destination: [required],
  destinationAmount: [required, integer]
});
export default sendValidation;
