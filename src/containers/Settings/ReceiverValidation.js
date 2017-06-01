import {createValidator, required, https} from 'utils/validation'

const receiverValidation = createValidator({
  name: [required],
  webhook: [required, https]
})
export default receiverValidation
