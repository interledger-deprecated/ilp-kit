import React, {Component} from 'react'
import PropTypes from 'prop-types'

import classNames from 'classnames/bind'
import styles from './ButtonDanger.scss'
const cx = classNames.bind(styles)

export default class ButtonDanger extends Component {
  static propTypes = {
    onConfirm: PropTypes.func.isRequired,
    id: PropTypes.string,
    initialText: PropTypes.string,
    confirmationText: PropTypes.string,
    className: PropTypes.string
  }

  static defaultProps = {
    initialText: 'Delete',
    confirmationText: 'Are you sure?'
  }

  state = {}

  componentWillReceiveProps(nextProps) {
    if (this.props.id !== nextProps.id) this.reset()
  }

  componentWillUnmount() {
    clearTimeout(this.showTimeout)
    clearTimeout(this.enableConfirmationTimeout)
  }

  handleShowConfirmation = () => {
    clearTimeout(this.showTimeout)

    // Hide the confirmation button if no action in 5 seconds
    this.showTimeout = setTimeout(this.reset, 5000)

    // Enable the confirmation button after 1 second
    this.enableConfirmationTimeout = setTimeout(this.enableConfirmation, 1000)

    this.setState({
      showConfirmation: true,
      disableConfirmation: true
    })
  }

  enableConfirmation = () => {
    this.setState({ disableConfirmation: false })
  }

  reset = () => {
    clearTimeout(this.showTimeout)
    clearTimeout(this.enableConfirmationTimeout)
    this.setState({ showConfirmation: false })
  }

  render() {
    const { onConfirm, initialText, confirmationText, className } = this.props
    const { showConfirmation, disableConfirmation } = this.state

    return (
      <span>
        {!showConfirmation &&
        <button className={cx('btn', 'btn-default', className)}
                onClick={this.handleShowConfirmation}>{initialText}</button>}

        {showConfirmation &&
        <button className={cx('btn', 'btn-danger', className)}
                onClick={onConfirm}
                disabled={disableConfirmation}>{confirmationText}</button>}
      </span>
    )
  }
}
