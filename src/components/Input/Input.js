import React, {Component, PropTypes} from 'react'

import cx from 'classnames/bind';

export default class Input extends Component {
  static propTypes = {
    object: PropTypes.object,
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

    this.props.object.onChange(event)

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

  domOnlyProps = (object) => {
    const newObject = {...object}
    delete newObject.initialValue
    delete newObject.autofill
    delete newObject.onUpdate
    delete newObject.valid
    delete newObject.invalid
    delete newObject.dirty
    delete newObject.pristine
    delete newObject.active
    delete newObject.touched
    delete newObject.visited
    delete newObject.autofilled
    delete newObject.error

    return newObject
  }

  renderInput() {
    const { object, type, disabled, size, focus, autoCapitalize, noErrors, validText } = this.props

    return (
      <span>
        <input type={type} ref="input"
               className={cx('form-control', size ? 'input-' + size : '')}
               autoFocus={focus} {...this.domOnlyProps(object)}
               onChange={this.onChange} disabled={disabled}
               autoCapitalize={autoCapitalize} />

        {!noErrors && object.dirty && object.error && <div className="text-danger">{object.error}</div>}
        {validText && <div className="text-success">{validText}</div>}
      </span>
    )
  }

  renderInputContainer() {
    const { object, label, disabled } = this.props

    return (
      <div className={cx('form-group', 'form-group-default', object.active && 'focused', disabled && 'disabled')}
           onClick={this.handleClick}>
        <label className={cx('fade')}>{label}</label>

        {this.renderInput()}
      </div>
    )
  }

  render() {
    return this.props.label ? this.renderInputContainer() : this.renderInput()
  }
}
