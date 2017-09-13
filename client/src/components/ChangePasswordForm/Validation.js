import { createValidator, required } from 'utils/validation'

const Validation = createValidator({
  password: [required],
  repeatPassword: [required]
})

export default Validation
