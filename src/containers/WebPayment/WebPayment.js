import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { routeActions } from 'react-router-redux'

import { getUser } from 'redux/actions/user'
import { transfer } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './WebPayment.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  user: state.user.user,
}), { getUser, pushState: routeActions.push, transfer })
export default class Pay extends Component {
  static propTypes = {
    // Props
    params: PropTypes.object.isRequired,
    // State
    user: PropTypes.object,
    transfer: PropTypes.func.isRequired
  }

  componentDidMount () {
    window.addEventListener('message', message => {
      console.log('WebPayment:29', message)
    }, false)
  }

  handlePay = () => {
    const amount = this.props.params.amount
    const destination = this.props.params.identifier

    return this.props.transfer({
      destination,
      destinationAmount: amount
    })
    .catch(err => {
      console.log('Pay:100', err)
      throw err
    })
  }

  render () {
    const { params } = this.props
    const currency = 'USD'

    // TODO:BEFORE_DEPLOY show loading

    return (
      <div className={cx('WebPayment')}>
        <div className={cx('window')}>
          <div className={cx('profile')}>
            <span className={cx('payingTo')}>Payment to</span>
            <h1>{params.identifier}</h1>
          </div>

          <div className={cx('total')}>
            <span className={cx('desc')}>
              Total:
            </span>
            <span className={cx('amount')}>
              {currency} {params.amount}
            </span>
          </div>

          <button type='submit' onClick={this.handlePay} className={cx('btn', 'btn-success', 'btn-lg', 'btnConfirm')}>Confirm</button>
        </div>
      </div>
    )
  }
}
