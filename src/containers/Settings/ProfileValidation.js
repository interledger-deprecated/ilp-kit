import {createValidator, required, minLength} from 'utils/validation'

const PasswordValidation = createValidator({
  email: [required],
  password: [required],
  newPassword: [minLength(6)],
  verifyNewPassword: [minLength(6)]
})
export default PasswordValidation
