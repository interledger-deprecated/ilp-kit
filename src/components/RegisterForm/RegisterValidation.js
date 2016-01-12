import {createValidator, required, minLength} from 'utils/validation';

const RegisterValidation = createValidator({
  username: [required, minLength(2)],
  password: [required]
});
export default RegisterValidation;
