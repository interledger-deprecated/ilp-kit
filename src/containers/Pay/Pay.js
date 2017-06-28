/* globals PaymentRequest */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { routeActions } from 'react-router-redux'

import { getUser } from 'redux/actions/user'

import Input from 'components/Input/Input'

import classNames from 'classnames/bind'
import styles from './Pay.scss'
const cx = classNames.bind(styles)

class AmountInput extends Component {
  render () {
    return (
      <div className={cx('input-group', 'amountInput')}>
        <span className='input-group-addon'>{this.props.currencyCode}</span>
        <Input
          {...this.props}
          ref='field'
          size='lg'
          noErrors
          debounce />
      </div>
    )
  }
}

@connect(state => ({
  user: state.user.user
}), { getUser, pushState: routeActions.push })
@reduxForm({
  form: 'pay'
  // TODO:UX validation
})
export default class Pay extends Component {
  static propTypes = {
    // Props
    params: PropTypes.object.isRequired,

    // Form
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,

    // State
    user: PropTypes.object
  }

  componentDidMount () {
    this.props.getUser(this.props.params.username)
  }

  handlePay = data => {
    const methodData = [
      {
        supportedMethods: ['interledger'],
        data: {
          spspEndpoint: `alice@blue.ilpdemo.org`
        }
      }
    ]
    const details = {
      total: {
        label: 'Sending amount',
        amount: { currency: this.props.user.currencyCode, value: data.amount }
      }
    }

    const paymentRequest = new PaymentRequest(methodData, details)
    paymentRequest.show()
      .then(paymentResponse => {
        console.log('payment response:', paymentResponse)
      })
      .catch(console.log)
  }

  render () {
    const { pristine, invalid, submitting, handleSubmit } = this.props
    const { user } = this.props

    // TODO:UI loading
    if (!user) return null

    return (
      <div className={cx('Pay')}>
        <div className={cx('window')}>
          <div className={cx('profile')}>
            <img src={user.imageUrl} className={cx('profilePic')} />
            <h1>{user.name || user.identifier}</h1>
          </div>

          <p className={cx('description')}>How much do you want to send?</p>

          <form onSubmit={handleSubmit(this.handlePay)}>
            <Field
              name='amount'
              component={AmountInput}
              type='number'
              size='lg'
              currencyCode={user.currencyCode} />

            <button type='submit'
                    className={cx('btn', 'btn-success', 'btn-block', 'btn-lg')}
                    disabled={pristine || invalid || submitting}>Pay</button>
          </form>
        </div>
      </div>
    )
  }
}
