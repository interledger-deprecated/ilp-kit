import {createValidator, required} from 'utils/validation';

const RegisterValidation = createValidator({
  username: [required],
  password: [required]
});
export default RegisterValidation;
