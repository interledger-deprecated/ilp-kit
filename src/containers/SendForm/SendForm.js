import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'
import sendValidation from './SendValidation'
import * as sendActions from 'redux/actions/send'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'
const cx = classNames.bind(styles)

import { Input } from 'components'

@reduxForm({
  form: 'send',
  fields: ['destination', 'sourceAmount', 'destinationAmount', 'message'],
  validate: sendValidation
})
@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo,
    send: state.send,
    fail: state.send.fail,
    path: state.send.path,
    pathFinding: state.send.pathFinding
  }),
  sendActions)
@successable()
@resetFormOnSuccess('send')
export default class SendForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    destinationChange: PropTypes.func.isRequired,
    destinationInfo: PropTypes.object,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,
    transfer: PropTypes.func.isRequired,
    findPath: PropTypes.func.isRequired,
    path: PropTypes.object,
    pathFinding: PropTypes.bool,
    data: PropTypes.object,
    initializeForm: PropTypes.func,

    // Successable
    succeed: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.object
  }

  static contextTypes = {
    config: PropTypes.object
  }

  componentDidMount() {
    const { data, initializeForm } = this.props
    // TODO sourceAmount
    if (data && data.destination && data.destinationAmount) {
      initializeForm({
        destination: data.destination,
        destinationAmount: data.destinationAmount
      })

      // Find path
      // TODO:UI feedback if pathfind fails
      this.props.findPath({
        destination: data.destination,
        destinationAmount: data.destinationAmount
      })
    }
  }

  // TODO doesn't handle the initial render
  componentWillReceiveProps(nextProps) {
    if (nextProps.path
      && ((nextProps.path.sourceAmount && nextProps.path.sourceAmount !== this.props.path.sourceAmount)
      || (nextProps.path.destinationAmount && nextProps.path.destinationAmount !== this.props.path.destinationAmount))) {

      if (!nextProps.fields.sourceAmount.active) {
        this.props.fields.sourceAmount.onChange(nextProps.path.sourceAmount)
      }

      if (!nextProps.fields.destinationAmount.active) {
        this.props.fields.destinationAmount.onChange(nextProps.path.destinationAmount)
      }
    }
  }

  // TODO introduce a latency
  handleDestinationChange = (target) => {
    this.props.destinationChange(target.value)
  }

  // TODO there should be a feedback on a failed pathfinding
  handleSourceAmountChange = (target) => {
    if (!this.props.values.destination) return

    this.props.findPath({
      destination: this.props.values.destination,
      sourceAmount: target.value
    })

    this.lastPathfindingField = 'source'
  }

  handleDestinationAmountChange = (target) => {
    if (!this.props.values.destination) return

    this.props.findPath({
      destination: this.props.values.destination,
      destinationAmount: target.value
    })

    this.lastPathfindingField = 'destination'
  }

  handleSubmit = (data) => {
    tracker.track('payment')
    return this.props.transfer(data).then(this.props.succeed)
  }

  render() {
    const { pristine, invalid, handleSubmit, submitting, success, destinationInfo,
      pathFinding, fail, data, fields: {destination, sourceAmount, destinationAmount, message} } = this.props
    const { config } = this.context

    const isSendingAmountFieldDisabled = !destination.value || fail.id || (pathFinding && this.lastPathfindingField === 'destination')
    const isReceivingAmountFieldDisabled = !destination.value || fail.id || (pathFinding && this.lastPathfindingField === 'source')

    // TODO initial render should show a currency
    return (
      <div className="row">
        <div className="col-sm-12">
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> You've just sent some money!
          </Alert>}

          {fail && fail.id &&
          <Alert bsStyle="danger">
            <strong>Woops! </strong>
            {(() => {
              switch (fail.id) {
                case 'LedgerInsufficientFundsError': return 'You have insufficient funds to make the payment'
                case 'NotFoundError': return 'Account not found'
                case 'NoPathsError': return 'Couldn\'t find paths to the destination account'
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <div className="form-group">
              <Input object={destination} label="Recipient" size="lg" focus onChange={this.handleDestinationChange} debounce />
            </div>
            <div>
              <Input object={message} label="Message" size="lg" disabled={!destination.value || fail.id} />
            </div>
            <div className="row">
              <div className="col-sm-6 form-group">
                <label>Sending</label>
                <div className={cx('input-group',
                  {disabled: isSendingAmountFieldDisabled},
                  {focused: sourceAmount.active})}>
                  <span className="input-group-addon">
                    {config.currencySymbol}
                  </span>
                  <Input object={sourceAmount} size="lg" onChange={this.handleSourceAmountChange} debounce disabled={isSendingAmountFieldDisabled} />
                </div>

                {sourceAmount.dirty && sourceAmount.error && <div className="text-danger">{sourceAmount.error}</div>}
              </div>
              <div className="col-sm-6 form-group">
                <label>Receiving</label>
                <div className={cx('input-group',
                  {disabled: isReceivingAmountFieldDisabled},
                  {focused: destinationAmount.active})}>
                  <span className="input-group-addon">
                    {(destinationInfo && destinationInfo.ledger && destinationInfo.ledger.currencySymbol) || config.currencySymbol}
                  </span>
                  <Input object={destinationAmount} size="lg" onChange={this.handleDestinationAmountChange} debounce disabled={isReceivingAmountFieldDisabled} />
                </div>

                {destinationAmount.dirty && destinationAmount.error && <div className="text-danger">{destinationAmount.error}</div>}
              </div>
            </div>
            <button type="submit" className="btn btn-complete"
              disabled={(!data && pristine) || invalid || submitting || pathFinding || fail.id}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    )
  }
}
