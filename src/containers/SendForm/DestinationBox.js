import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { destinationChange, destinationReset } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './DestinationBox.scss'

import Input from 'components/Input/Input'

const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo
  }),
  { destinationChange, destinationReset })
export default class DestinationBox extends Component {
  static propTypes = {
    meta: PropTypes.object.isRequired,
    destinationInfo: PropTypes.object,
    destinationReset: PropTypes.func,
    input: PropTypes.object
  }

  componentDidMount () {
    // Activate amounts if the recipient is already filled
    if (this.props.input.value) {
      setTimeout(() => {
        this.refs.recipient.refs.input.blur()
      }, 300)
    }
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
            ref='recipient'
            label='Recipient'
            size='lg'
            validText={!meta.active && destinationInfo.name}
            onChange={this.onChange}
            autoCapitalize='off'
            focus
            debounce />

          {!meta.active && destinationInfo.imageUrl &&
          <img src={destinationInfo.imageUrl || require('../../../static/placeholder.png')} />}
        </div>
      </div>
    )
  }
}
