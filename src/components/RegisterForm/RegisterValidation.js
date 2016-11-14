import {createValidator, required, minLength, email, uuid} from 'utils/validation'

const RegisterValidation = createValidator({
  username: [required, minLength(2)],
  email: [required, email],
  password: [required, minLength(5)],
  inviteCode: [uuid]
})
export default RegisterValidation
