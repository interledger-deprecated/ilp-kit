import React, {Component, PropTypes} from 'react'

import cx from 'classnames/bind';

export default class Input extends Component {
  static propTypes = {
    object: PropTypes.object,
    type: PropTypes.string,
    label: PropTypes.string,
    size: PropTypes.string,
    focus: PropTypes.bool,
    onChange: PropTypes.func
  }

  static defaultProps = {
    type: 'text',
    size: '',
    focus: false
  }

  // Default event, if onChange is not specified
  onChange = (event) => {
    this.props.object.onChange(event)
  }

  // Clicking anywhere on the container should focus on the input
  handleClick = () => {
    this.refs.input.focus()
  }

  render() {
    const { object, type, label, size, focus, onChange } = this.props

    return (
      <div className={cx('form-group', 'form-group-default', object.active ? ' focused' : '')}
        onClick={this.handleClick}>
        <label className={cx('fade')}>{label}</label>

        <input type={type} ref="input"
               className={cx('form-control', size ? 'input-' + size : '')}
               autoFocus={focus} {...object} onChange={onChange || this.onChange} />

        {object.dirty && object.error && <div className="text-danger">{object.error}</div>}
      </div>
    )
  }
}
