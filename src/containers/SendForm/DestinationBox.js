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
    destinationInfo: PropTypes.object,
    destinationField: PropTypes.object
  }

  componentWillReceiveProps(nextProps) {
    const input = nextProps.destinationField
    const identifier = nextProps.destinationInfo.identifier

    // Destination change
    if (identifier && this.props.destinationInfo.identifier !== identifier) {
      // Update the input if it's not what caused the change (not focused)
      if (!input.active) {
        input.onChange(identifier)
      }
    }
  }

  onChange = (e) => {
    if (!e.value) {
      this.props.destinationReset()
    }
  }

  render() {
    const { destinationInfo, destinationField } = this.props

    return (
      <div className={cx('DestinationBox')}>
        <div className={cx('form-group', 'inputBox',
          !destinationField.active && destinationInfo.name && 'hasName',
          !destinationField.active && destinationInfo.imageUrl && 'hasImage',
          destinationField.dirty && destinationField.error && 'hasError')}>
          <Input object={destinationField}
                 label="Recipient"
                 size="lg"
                 validText={!destinationField.active && destinationInfo.name}
                 onChange={this.onChange}
                 focus
                 debounce />

          {!destinationField.active && destinationInfo.imageUrl &&
          <img src={destinationInfo.imageUrl || require('../../components/ActivityPayment/placeholder.png')} />}
        </div>
      </div>
    )
  }
}
