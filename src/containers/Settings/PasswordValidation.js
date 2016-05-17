import {createValidator, required, minLength} from 'utils/validation';

const PasswordValidation = createValidator({
  password: [required, minLength(5)],
  verifyPassword: [required, minLength(5)]
});
export default PasswordValidation;
