import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { validate, asyncValidate } from './SendValidation'
import * as sendActions from 'redux/actions/send'

import { successable, resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import DestinationBox from './DestinationBox'
import AmountsBox from './AmountsBox'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'

import Input from 'components/Input/Input'

const cx = classNames.bind(styles)

@connect((state, props) => ({
  user: state.auth.user,
  send: state.send,
  config: state.auth.config,
  err: state.send.err,
  quoteError: state.send.quoteError,
  quoting: state.send.quoting,
  advancedMode: state.auth.advancedMode
  // initialValues: props.params
}),
{...sendActions, resetData: sendActions.reset})
@reduxForm({
  form: 'send',
  validate,
  asyncValidate,
  asyncBlurFields: ['destination']
})
@successable()
@resetFormOnSuccess('send')
export default class SendForm extends Component {
  static propTypes = {
    user: PropTypes.object,
    transfer: PropTypes.func.isRequired,
    quoting: PropTypes.bool,
    err: PropTypes.object,
    quoteError: PropTypes.object,
    resetData: PropTypes.func,
    data: PropTypes.object,
    // Used in form validation
    // eslint-disable-next-line react/no-unused-prop-types
    config: PropTypes.object,
    advancedMode: PropTypes.bool,
    unmount: PropTypes.func,
    params: PropTypes.object,

    // Form
    change: PropTypes.func.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool
  }

  state = {}

  componentWillMount () {
    if (!this.props.params) return

    const { destination, sourceAmount, destinationAmount, message } = this.props.params
    const change = this.props.change

    destination && change('destination', destination)
    sourceAmount && change('sourceAmount', sourceAmount)
    destinationAmount && change('destinationAmount', destinationAmount)
    message && change('message', message)
  }

  componentWillUnmount () {
    this.props.unmount()
  }

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
      this.props.change('repeats', '')
      this.props.change('interval', '')
    }

    this.setState({
      ...this.state,
      showAdvanced: !this.state.showAdvanced
    })

    event.preventDefault()
  }

  render () {
    if (!this.props.user) return null

    const { pristine, invalid, handleSubmit, submitting, success,
      advancedMode, quoting, data, err, quoteError } = this.props
    const { showAdvanced } = this.state

    // TODO initial render should show a currency
    return (
      <div className='row'>
        <div className='col-sm-12'>
          <div className={cx('notification', success && 'show')}>
            <Alert bsStyle='success'>
              <i className={cx('fa', 'fa-check-circle')} /> Your payment has been sent
            </Alert>
          </div>

          {err && err.id &&
          <Alert bsStyle='danger'>
            {(() => {
              switch (err.id) {
                case 'LedgerInsufficientFundsError': return 'You have insufficient funds to make the payment'
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <form onSubmit={handleSubmit(this.handleSubmit)}>
            <Field
              name='destination'
              component={DestinationBox} />
            <div>
              <Field
                name='message'
                component={Input}
                label='Message'
                size='lg' />
            </div>
            <div className={cx('amounts')}>
              <div className={cx('row', 'row-sm')}>
                <Field
                  name='sourceAmount'
                  component={AmountsBox}
                  type='source' />
                <Field
                  name='destinationAmount'
                  component={AmountsBox}
                  type='destination' />
              </div>

              {quoteError && quoteError.id && <div className='text-danger'>No quote for the specified recipient or amount</div>}
            </div>

            {showAdvanced && advancedMode &&
            <div className={cx('advanced')}>
              <div className={cx('row', 'description')}>
                These fields are for streaming payments. The wallet will submit the same payment <i>"repeat"</i> times every <i>"interval"</i> milliseconds.
              </div>
              <div className='row'>
                <div className='col-xs-12 col-sm-6 form-group'>
                  <label>Repeats</label>
                  <Field
                    name='repeats'
                    component={Input} />
                </div>
                <div className='col-xs-12 col-sm-6 form-group'>
                  <label>Interval</label>
                  <Field
                    name='interval'
                    component={Input} />
                </div>
              </div>
            </div>}

            <div className='row'>
              <div className='col-sm-5'>
                <button type='submit' className='btn btn-success btn-block btn-lg'
                  disabled={(!data && pristine) || invalid || submitting || quoting || err.id === 'NotFoundError' || (quoteError && quoteError.id)}>
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className={cx('col-sm-7', 'advancedLink')}>
                {!submitting && advancedMode &&
                <a href='' onClick={this.toggleAdvanced}>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</a>}

                {showAdvanced && submitting && this.interval &&
                <button type='button' onClick={this.stopRepeatedPayments} className='btn btn-danger'>Stop</button>}
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}
