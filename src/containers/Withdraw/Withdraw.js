import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { routeActions } from 'react-router-redux'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './Withdraw.scss'

import { withdraw } from 'redux/actions/withdrawal'

const cx = classNames.bind(styles)

@connect(state => ({

}), { withdraw, pushState: routeActions.push })
export default class Withdraw extends Component {
  static propTypes = {
    withdraw: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
  }

  state = {}

  handleWithdraw = e => {
    e.preventDefault()

    this.setState({ loading: true })

    this.props.withdraw(this.refs.amount.value)
      .then(() => {
        this.setState({ loading: false })
        this.props.pushState('/')
      })
      .catch(error => {
        this.setState({ loading: false, error })
      })
  }

  render () {
    const { loading, error } = this.state

    return (
      <div>
        <h3 className={cx('title')}>
          <div>Withdrawal</div>
        </h3>

        <form onSubmit={this.handleWithdraw} className={cx('inputBox')}>
          {error && error.id &&
          <Alert bsStyle='danger'>
            {(() => {
              switch (error.id) {
                case 'LedgerInsufficientFundsError': return "You can't withdraw more than you have"
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <label>
            <div>Enter the amount</div>
            <input type='text' ref='amount' className={cx('amountField')} />
          </label>
          <div>
            <button type='submit' className={cx('btn', 'btn-success', 'btn-lg')}
              disabled={loading}>{loading ? 'Loading...' : 'Make a Payment'}</button>
          </div>
        </form>
      </div>
    )
  }
}
