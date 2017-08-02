import {createValidator, required, integer, hostname, hostnameNotSelf, peerHostname} from 'utils/validation'

export const validate = (values, props) => {
  return createValidator({
    hostname: [required, hostname, hostnameNotSelf, peerHostname(props.peerState.list)],
    limit: [required, integer],
    currencyCode: [required]
  })(values, props)
}
