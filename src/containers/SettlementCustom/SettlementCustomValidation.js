import { createValidator, required } from 'utils/validation'

const SettlementCustomValidation = createValidator({
  uri: [required]
})
export default SettlementCustomValidation
