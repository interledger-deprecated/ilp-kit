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

import Input from 'components/Input/Input'

@reduxForm({
  form: 'send',
  fields: ['destination', 'sourceAmount', 'destinationAmount', 'message', 'repeats', 'interval'],
  validate: sendValidation
})
@connect(
  state => ({
    user: state.auth.user,
    destinationInfo: state.send.destinationInfo,
    send: state.send,
    quote: state.send.quote,
    quoting: state.send.quoting
  }),
  {...sendActions, resetData: sendActions.reset})
@successable()
@resetFormOnSuccess('send')
export default class SendForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    destinationChange: PropTypes.func.isRequired,
    destinationInfo: PropTypes.object,
    transfer: PropTypes.func.isRequired,
    requestQuote: PropTypes.func.isRequired,
    quote: PropTypes.object,
    quoting: PropTypes.bool,
    resetData: PropTypes.func,
    data: PropTypes.object,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,
    initializeForm: PropTypes.func,

    // Successable
    permSuccess: PropTypes.func,
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    tempFail: PropTypes.func,
    fail: PropTypes.any,
    reset: PropTypes.func
  }

  static contextTypes = {
    config: PropTypes.object
  }

  state = {}

  componentDidMount() {
    const { data, initializeForm } = this.props
    // TODO sourceAmount
    if (data && data.destination && data.destinationAmount) {
      initializeForm({
        destination: data.destination,
        destinationAmount: data.destinationAmount
      })

      // Request a quote
      // TODO:UI feedback if quoting fails
      this.props.requestQuote({
        destination: data.destination,
        destinationAmount: data.destinationAmount
      })
    }
  }

  // TODO doesn't handle the initial render
  componentWillReceiveProps(nextProps) {
    const thisQuote = this.props.quote
    const nextQuote = nextProps.quote

    // Quote source or destination has been changed
    if (thisQuote.sourceAmount !== nextQuote.sourceAmount || thisQuote.destinationAmount !== nextQuote.destinationAmount) {
      if (!nextProps.fields.sourceAmount.active) {
        this.props.fields.sourceAmount.onChange(nextQuote.sourceAmount)
      }

      if (!nextProps.fields.destinationAmount.active) {
        this.props.fields.destinationAmount.onChange(nextQuote.destinationAmount)
      }
    }
  }

  // TODO introduce a latency
  handleDestinationChange = (target) => {
    // TODO check for webfinger email too
    if (target.value === this.props.user.username) {
      return this.props.permFail({id: 'SendToSelfError'})
    }

    this.props.destinationChange(target.value)
      .then(this.props.reset)
      .catch(this.props.permFail)
  }

  // TODO there should be a feedback on a failed pathfinding
  handleSourceAmountChange = (target) => {
    if (!this.props.values.destination) return

    // Clear the destination amount field
    if (this.props.values.destinationAmount) {
      this.props.fields.destinationAmount.onChange()
    }

    this.props.requestQuote({
      destination: this.props.values.destination,
      sourceAmount: target.value
    }).catch(this.props.permFail)

    this.lastQuotingField = 'source'
  }

  handleDestinationAmountChange = (target) => {
    if (!this.props.values.destination) return

    // Clear the source amount field
    if (this.props.values.sourceAmount) {
      this.props.fields.sourceAmount.onChange()
    }

    this.props.requestQuote({
      destination: this.props.values.destination,
      destinationAmount: target.value
    })

    this.lastQuotingField = 'destination'
  }

  transfer = (data) => {
    return this.props.transfer(data)
      .catch((err) => {
        this.props.permFail(err)
        clearInterval(this.interval)
      })
  }

  stopRepeatedPayments = () => {}

  handleSubmit = (data) => {
    tracker.track('payment')

    // TODO should also work if no interval is provided
    // TODO should be able to cancel the interval

    // Single payment
    if (!data.repeats || !data.interval) {
      return this.transfer(data).then(() => {
        this.props.tempSuccess()
        this.props.resetData()
      })
    }

    // Repeated payments
    return new Promise((resolve) => {
      this.stopRepeatedPayments = () => {
        resolve()
        this.props.tempSuccess()
        this.props.resetData()
        clearInterval(this.interval)
      }

      this.interval = setInterval(() => {
        data.repeats--

        this.transfer(data).then(() => {
          if (data.repeats === 0) {
            this.stopRepeatedPayments()
          }
        })
      }, data.interval)
    })
  }

  toggleAdvanced = (event) => {
    if (this.state.showAdvanced) {
      this.props.fields.repeats.onChange('')
      this.props.fields.interval.onChange('')
    }

    this.setState({
      ...this.state,
      showAdvanced: !this.state.showAdvanced
    })

    event.preventDefault()
  }

  render() {
    if (!this.props.user) return null

    const { pristine, invalid, handleSubmit, submitting, success, destinationInfo,
      quoting, fail, data, fields: {destination, sourceAmount, destinationAmount, message, repeats, interval} } = this.props
    const { config } = this.context
    const { showAdvanced } = this.state

    const isSendingAmountFieldDisabled = !destination.value
      || fail.id === 'NotFoundError' || fail.id === 'SendToSelfError'
      || (quoting && this.lastQuotingField === 'destination')
    const isReceivingAmountFieldDisabled = !destination.value
      || fail.id === 'NotFoundError' || fail.id === 'SendToSelfError'
      || (quoting && this.lastQuotingField === 'source')

    // TODO initial render should show a currency
    return (
      <div className="row">
        <div className="col-sm-12">
          {success &&
          <Alert bsStyle="success">
            You've just sent some money!
          </Alert>}

          {fail && fail.id &&
          <Alert bsStyle="danger">
            <strong>Woops! </strong>
            {(() => {
              switch (fail.id) {
                case 'LedgerInsufficientFundsError': return 'You have insufficient funds to make the payment'
                case 'NotFoundError': return 'Account not found'
                case 'NoQuoteError': return "Couldn't find a quote for the specified recipient or amount"
                case 'SendToSelfError': return "There's no point in sending money to yourself"
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <div className="form-group">
              <Input object={destination} label="Recipient" size="lg" focus onChange={this.handleDestinationChange} debounce />
            </div>
            {destinationInfo.currencyCode &&
            <div className={cx('destinationPreview')}>
              <img src={destinationInfo.imageUrl || require('../../components/HistoryItem/placeholder.png')} />
              <div className={cx('info')}>
                <div className={cx('name')}>{destinationInfo.name || destination.value}</div>
                <div className={cx('currency')}>Accepts {destinationInfo.currencyCode}({destinationInfo.currencySymbol})</div>
              </div>
            </div>}
            <div>
              <Input object={message} label="Message" size="lg" />
            </div>

            <div className="row">
              <div className="col-sm-6 form-group">
                <label>You Send</label>
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
                <label>They Receive</label>
                <div className={cx('input-group',
                  {disabled: isReceivingAmountFieldDisabled},
                  {focused: destinationAmount.active})}>
                  <span className="input-group-addon">
                    {(destinationInfo && destinationInfo.currencySymbol) || config.currencySymbol}
                  </span>
                  <Input object={destinationAmount} size="lg" onChange={this.handleDestinationAmountChange} debounce disabled={isReceivingAmountFieldDisabled} />
                </div>

                {destinationAmount.dirty && destinationAmount.error && <div className="text-danger">{destinationAmount.error}</div>}
              </div>
            </div>

            {showAdvanced &&
            <div className={cx('advanced')}>
              <div className={cx('row', 'description')}>
                These fields are for streaming payments. The wallet will submit the same payment <i>"repeat"</i> times every <i>"interval"</i> milliseconds.
              </div>
              <div className="row">
                <div className="col-sm-6 form-group">
                  <label>Repeats</label>
                  <Input object={repeats} />
                </div>
                <div className="col-sm-6 form-group">
                  <label>Interval</label>
                  <Input object={interval} />
                </div>
              </div>
            </div>}

            <div className="row">
              <div className="col-sm-5">
                <button type="submit" className="btn btn-complete btn-block"
                  disabled={(!data && pristine) || invalid || submitting || quoting || fail.id === 'NotFoundError' || fail.id === 'SendToSelfError'}>
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className={cx('col-sm-7', 'advancedLink')}>
                {!submitting &&
                <a href="" onClick={this.toggleAdvanced}>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</a>}

                {showAdvanced && submitting && this.interval &&
                <button type="button" onClick={this.stopRepeatedPayments} className="btn btn-danger">Stop</button>}
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}
