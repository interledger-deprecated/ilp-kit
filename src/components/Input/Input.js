import React, { Component } from 'react'
import PropTypes from 'prop-types'

import cx from 'classnames/bind'

export default class Input extends Component {
  static propTypes = {
    meta: PropTypes.object.isRequired,
    input: PropTypes.object.isRequired,
    type: PropTypes.string,
    disabled: PropTypes.any,
    label: PropTypes.string,
    size: PropTypes.string,
    focus: PropTypes.bool,
    autoCapitalize: PropTypes.string,
    onChange: PropTypes.func,
    debounce: PropTypes.bool,
    noErrors: PropTypes.bool,
    validText: PropTypes.any
  }

  static defaultProps = {
    type: 'text',
    size: '',
    focus: false
  }

  // Default event, if onChange is not specified
  onChange = (event) => {
    const self = this

    this.props.input.onChange(event)

    const target = event.target

    if (this.props.onChange) {
      // Used for ajax change handlers
      if (this.props.debounce) {
        clearTimeout(self.delay)
        self.delay = setTimeout(() => {
          this.props.onChange(target)
        }, 400)
      } else {
        this.props.onChange(target)
      }
    }
  }

  // Clicking anywhere on the container should focus on the input
  handleClick = () => {
    this.refs.input.focus()
  }

  renderInput () {
    const { meta, input, type, disabled, size, focus, autoCapitalize, noErrors, validText } = this.props

    return (
      <span>
        <input type={type} ref='input'
          className={cx('form-control', size ? 'input-' + size : '')}
          autoFocus={focus} {...input}
          onChange={this.onChange} disabled={disabled}
          autoCapitalize={autoCapitalize} />

        {!noErrors && meta.dirty && meta.error && <div className='text-danger'>{meta.error}</div>}
        {validText && <div className='text-success'>{validText}</div>}
      </span>
    )
  }

  renderInputContainer () {
    const { meta, label, disabled } = this.props

    return (
      <div className={cx('form-group', 'form-group-default', meta.active && 'focused', disabled && 'disabled')}
        onClick={this.handleClick}>
        <label>{label}</label>

        {this.renderInput()}
      </div>
    )
  }

  render () {
    return this.props.label ? this.renderInputContainer() : this.renderInput()
  }
}
