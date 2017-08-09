import {createValidator, required} from 'utils/validation'

const Validation = createValidator({
  resource: [required]
})
export default Validation
