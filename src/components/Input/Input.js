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
    onChange: PropTypes.func,
    debounce: PropTypes.bool
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
        }, 250)
      } else {
        this.props.onChange(target)
      }
    }
  }

  // Clicking anywhere on the container should focus on the input
  handleClick = () => {
    this.refs.input.focus()
  }

  renderInput() {
    const { object, type, disabled, size, focus } = this.props

    return (
      <span>
        <input type={type} ref="input"
          className={cx('form-control', size ? 'input-' + size : '')}
          autoFocus={focus} {...object} onChange={this.onChange} disabled={disabled} />

        {object.dirty && object.error && <div className="text-danger">{object.error}</div>}
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
