import {createValidator, required, minLength, email, uuid, username} from 'utils/validation'

const RegisterValidation = createValidator({
  username: [required, username],
  email: [required, email],
  password: [required, minLength(5)],
  inviteCode: [uuid]
})
export default RegisterValidation
