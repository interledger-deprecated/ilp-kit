import {createValidator, required, integer} from 'utils/validation'

const inviteValidation = createValidator({
  amount: [required, integer]
})
export default inviteValidation
