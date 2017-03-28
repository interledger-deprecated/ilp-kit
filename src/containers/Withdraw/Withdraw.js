import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { routeActions } from 'react-router-redux'

import classNames from 'classnames/bind'
import styles from './Withdraw.scss'
const cx = classNames.bind(styles)

import { withdraw } from 'redux/actions/withdrawal'

@connect(state => ({

}), { withdraw, pushState: routeActions.push })
export default class Withdraw extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
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
      .catch(() => {this.setState({ loading: false })})
  }

  render() {
    const { loading } = this.state

    return (
      <div>
        <h3 className={cx('title')}>
          <div>Withdrawal</div>
        </h3>

        <form onSubmit={this.handleWithdraw} className={cx('inputBox')}>
          <label>
            <div>Enter the amount</div>
            <input type="text" ref="amount" className={cx('amountField')} />
          </label>
          <div>
            <button type="submit" className={cx('btn', 'btn-success', 'btn-lg')}
                    disabled={loading}>{loading ? 'Loading...' : 'Make a Payment'}</button>
          </div>
        </form>
      </div>
    )
  }
}
