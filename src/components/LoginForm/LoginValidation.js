import {createValidator, required} from 'utils/validation'

const LoginValidation = createValidator({
  username: [required],
  password: [required]
})
export default LoginValidation
