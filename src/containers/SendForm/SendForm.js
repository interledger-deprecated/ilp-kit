import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import { validate } from './SendValidation'
import * as sendActions from 'redux/actions/send'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import DestinationBox from './DestinationBox'
import AmountsBox from './AmountsBox'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@reduxForm({
  form: 'send',
  fields: ['destination', 'sourceAmount', 'destinationAmount', 'message', 'repeats', 'interval'],
  validate,
  asyncBlurFields: ['destination'],
}, state => ({
  user: state.auth.user,
  destinationInfo: state.send.destinationInfo,
  sourceAmount: state.send.sourceAmount,
  destinationAmount: state.send.destinationAmount,
  send: state.send,
  quote: state.send.quote,
  err: state.send.err,
  quoting: state.send.quoting,
  advancedMode: state.auth.advancedMode,
  config: state.auth.config,
}),
{...sendActions, resetData: sendActions.reset})
@successable()
@resetFormOnSuccess('send')
export default class SendForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    destinationChange: PropTypes.func.isRequired,
    destinationInfo: PropTypes.object,
    amountsChange: PropTypes.func.isRequired,
    sourceAmount: PropTypes.number,
    destinationAmount: PropTypes.number,
    transfer: PropTypes.func.isRequired,
    quote: PropTypes.object,
    quoting: PropTypes.bool,
    err: PropTypes.object,
    resetData: PropTypes.func,
    data: PropTypes.object,
    advancedMode: PropTypes.bool,
    config: PropTypes.object,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,
    initializeForm: PropTypes.func,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    reset: PropTypes.func
  }

  state = {}

  transfer = data => {
    return this.props.transfer(data)
      .catch(err => {
        clearInterval(this.interval)

        throw err
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
        setTimeout(() => {
          resolve()
          this.props.tempSuccess()
          this.props.resetData()
        }, 1000)

        clearInterval(this.interval)
      }

      this.interval = setInterval(() => {
        data.repeats--

        this.transfer(data)

        if (data.repeats < 1) {
          this.stopRepeatedPayments()
        }
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

    const { pristine, invalid, handleSubmit, submitting, success,
      advancedMode, quoting, data, fields: { destination, sourceAmount,
      destinationAmount, message, repeats, interval }, err } = this.props
    const { showAdvanced } = this.state

    console.log('SendForm:145', err)

    // TODO initial render should show a currency
    return (
      <div className="row">
        <div className="col-sm-12">
          {success &&
          <Alert bsStyle="success">
            You've just sent some money!
          </Alert>}

          {err && err.id &&
          <Alert bsStyle="danger">
            {(() => {
              switch (err.id) {
                case 'LedgerInsufficientFundsError': return 'You have insufficient funds to make the payment'
                case 'NotFoundError': return 'Account not found'
                case 'NoQuoteError': return "Couldn't find a quote for the specified recipient or amount"
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <DestinationBox destinationField={destination} />
            <div>
              <Input object={message} label="Message" size="lg" />
            </div>
            <AmountsBox sourceAmountField={sourceAmount} destinationAmountField={destinationAmount} />

            {showAdvanced && advancedMode &&
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
                  disabled={(!data && pristine) || invalid || submitting || quoting || err.id === 'NotFoundError'}>
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className={cx('col-sm-7', 'advancedLink')}>
                {!submitting && advancedMode &&
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
