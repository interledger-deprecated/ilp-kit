import {createValidator, required, minLength, email, uuid, username} from 'utils/validation'

const SettlementCustomValidation = createValidator({
  uri: [required]
})
export default SettlementCustomValidation
