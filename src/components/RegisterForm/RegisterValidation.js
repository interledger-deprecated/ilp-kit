import {createValidator, required, minLength, email} from 'utils/validation';

const RegisterValidation = createValidator({
  username: [required, minLength(2)],
  email: [required, email],
  password: [required, minLength(5)]
});
export default RegisterValidation;
