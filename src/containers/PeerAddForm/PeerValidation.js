import {createValidator, required, integer} from 'utils/validation'

const peerValidation = createValidator({
  hostname: [required],
  limit: [required, integer],
  currency: [required]
})
export default peerValidation
