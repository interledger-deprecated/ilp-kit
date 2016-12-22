import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'
import { destinationChange } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo
  }),
  { destinationChange })
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
    if (this.props.destinationInfo.identifier !== identifier) {
      // Update the input if it's not what caused the change (not focused)
      if (!input.active) {
        input.onChange(identifier)
      }
    }
  }

  handleDestinationInputChange = target => {
    if (target.value === this.props.destinationInfo.identifier || this.props.destinationField.invalid) return

    this.props.destinationChange(target.value)
  }

  render() {
    const { destinationInfo, destinationField } = this.props

    return (
      <div>
        <div className="form-group">
          <Input object={destinationField} label="Recipient" size="lg" focus onChange={this.handleDestinationInputChange} debounce />
        </div>
        {destinationInfo.currencyCode &&
        <div className={cx('destinationPreview')}>
          <img src={destinationInfo.imageUrl || require('../../components/HistoryItem/placeholder.png')} />
          <div className={cx('info')}>
            <div className={cx('name')}>{destinationInfo.name || destinationField.value}</div>
            <div className={cx('currency')}>Accepts {destinationInfo.currencyCode}({destinationInfo.currencySymbol})</div>
          </div>
        </div>}
      </div>
    )
  }
}
