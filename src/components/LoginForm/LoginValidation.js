import {createValidator, required} from 'utils/validation';

const LoginValidation = createValidator({
  name: [required],
  password: [required]
});
export default LoginValidation;
