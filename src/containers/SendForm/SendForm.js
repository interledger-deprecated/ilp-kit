import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'
import sendValidation from './SendValidation'
import * as sendActions from 'redux/actions/send'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'
const cx = classNames.bind(styles)

@reduxForm({
  form: 'send',
  fields: ['destination', 'sourceAmount', 'destinationAmount'],
  validate: sendValidation
})
@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail,
    path: state.send.path,
    pathFinding: state.send.pathFinding
  }),
  sendActions)
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
    unmount: PropTypes.func.isRequired,
    success: PropTypes.bool,
    path: PropTypes.object,
    pathFinding: PropTypes.bool,
    fail: PropTypes.object,
    data: PropTypes.object,
    initializeForm: PropTypes.func
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
  shouldComponentUpdate(nextProps) {
    // Reset the form after a successful transfer
    if (!this.props.success && nextProps.success) {
      this.props.initializeForm()
      return false
    }

    return true
  }

  // Remove the success/error messages on unmount
  componentWillUnmount() {
    this.props.unmount()
  }

  handleDestinationChange = (event) => {
    this.props.fields.destination.onChange(event)

    this.props.destinationChange(event.target.value)
  }

  // TODO there should be a feedback on a failed pathfinding
  handleSourceAmountChange = (event) => {
    this.props.fields.sourceAmount.onChange(event)
    if (!this.props.values.destination) return

    this.props.findPath({
      destination: this.props.values.destination,
      sourceAmount: event.target.value
    })

    this.lastPathfindingField = 'source'
  }

  handleDestinationAmountChange = (event) => {
    this.props.fields.destinationAmount.onChange(event)
    if (!this.props.values.destination) return

    this.props.findPath({
      destination: this.props.values.destination,
      destinationAmount: event.target.value
    })

    this.lastPathfindingField = 'destination'
  }

  render() {
    const { pristine, invalid, handleSubmit, transfer, submitting, success, destinationInfo,
      pathFinding, fail, data, fields: {destination, sourceAmount, destinationAmount} } = this.props
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

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className="form-control input-lg"
                autoFocus {...destination} onChange={this.handleDestinationChange} placeholder="alice@wallet.com" />
              {destination.dirty && destination.error &&
                <div className="text-danger">{destination.error}</div>}
            </div>
            <div className="row">
              <div className="col-sm-6 form-group">
                <label>Sending Amount</label>
                <div className={cx('input-group',
                  {disabled: isSendingAmountFieldDisabled},
                  {focused: sourceAmount.active})}>
                  <span className="input-group-addon">
                    {config.currencySymbol}
                  </span>
                  <input type="text" className="form-control input-lg"
                    {...sourceAmount} onChange={this.handleSourceAmountChange}
                    disabled={isSendingAmountFieldDisabled} />
                </div>

                {sourceAmount.dirty && sourceAmount.error && <div className="text-danger">{sourceAmount.error}</div>}
              </div>
              <div className="col-sm-6 form-group">
                <label>Receiving Amount</label>
                <div className={cx('input-group',
                  {disabled: isReceivingAmountFieldDisabled},
                  {focused: destinationAmount.active})}>
                  <span className="input-group-addon">
                    {destinationInfo && destinationInfo.ledger && destinationInfo.ledger.currencySymbol}
                  </span>
                  <input type="text" className="form-control input-lg"
                    {...destinationAmount} onChange={this.handleDestinationAmountChange}
                    disabled={isReceivingAmountFieldDisabled} />
                </div>

                {destinationAmount.dirty && destinationAmount.error && <div className="text-danger">{destinationAmount.error}</div>}
              </div>
            </div>
            <button type="submit" className="btn"
              disabled={(!data && pristine) || invalid || submitting || pathFinding || fail.id}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    )
  }
}
