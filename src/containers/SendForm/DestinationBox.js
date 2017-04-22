import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'
import { destinationChange, destinationReset } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './DestinationBox.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo
  }),
  { destinationChange, destinationReset })
export default class DestinationBox extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    destinationChange: PropTypes.func.isRequired,
    destinationInfo: PropTypes.object
  }

  componentWillReceiveProps ({ meta, input, destinationInfo }) {
    const identifier = destinationInfo.identifier

    // Destination change
    if (identifier && this.props.destinationInfo.identifier !== identifier) {
      // Update the input if it's not what caused the change (not focused)
      if (!meta.active) {
        input.onChange(identifier)
      }
    }
  }

  onChange = (e) => {
    if (!e.value) {
      this.props.destinationReset()
    }
  }

  render () {
    const { destinationInfo, meta } = this.props

    return (
      <div className={cx('DestinationBox')}>
        <div className={cx('form-group', 'inputBox',
          !meta.active && destinationInfo.name && 'hasName',
          !meta.active && destinationInfo.imageUrl && 'hasImage',
          meta.dirty && meta.error && 'hasError')}>
          <Input
            {...this.props}
            label="Recipient"
            size="lg"
            validText={!meta.active && destinationInfo.name}
            onChange={this.onChange}
            focus
            debounce />

          {!meta.active && destinationInfo.imageUrl &&
          <img src={destinationInfo.imageUrl || require('../../containers/ActivityPayment/placeholder.png')} />}
        </div>
      </div>
    )
  }
}
