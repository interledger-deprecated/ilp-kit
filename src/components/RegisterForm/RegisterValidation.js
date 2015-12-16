import {createValidator, required} from 'utils/validation';

const RegisterValidation = createValidator({
  name: [required],
  password: [required]
});
export default RegisterValidation;
