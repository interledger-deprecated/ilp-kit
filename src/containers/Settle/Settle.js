import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import classNames from 'classnames/bind'
import styles from './Settle.scss'

import { getDestination, settle } from 'redux/actions/settlement_method'

const cx = classNames.bind(styles)

@connect(state => ({
  destination: state.settlementMethod.destination
}), { getDestination, settle })
export default class Settle extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    getDestination: PropTypes.func.isRequired,
    destination: PropTypes.object,
    settle: PropTypes.func.isRequired
  }

  state = {}

  componentWillMount () {
    this.props.getDestination(this.props.params.destination)
  }

  componentDidMount () {
    this.setState({
      hostname: location.hostname
    })
  }

  handleSettle = e => {
    e.preventDefault()

    if (!this.refs.amount.value || parseInt(this.refs.amount.value) < 1) return

    this.setState({
      ...this.state,
      loading: true
    })

    // TODO handle exceptions
    this.props.settle(this.props.params.destination, {amount: this.refs.amount.value})
      .then(response => {
        location.href = response.approvalLink
      })
  }

  render () {
    const { destination, params, location } = this.props
    const { hostname, loading } = this.state

    const initialAmount = (location.query && location.query.amount) || 0

    return (
      <div>
        <h3 className={cx('title')}>
          {destination.type === 'peer' &&
          <div>
            <div>You are trying to settle the trustline</div>
            <div>between <b>{hostname}</b> and <b>{destination.hostname}</b></div>
            <div>using <b>{params.method}</b>.</div>
          </div>}

          {destination.type === 'user' &&
          <div>You are depositing using <b>{params.method}</b>.</div>}
        </h3>

        <form onSubmit={this.handleSettle} className={cx('inputBox')}>
          <label>
            <div>Enter the amount</div>
            <input type='text' ref='amount' className={cx('amountField')} defaultValue={initialAmount} />
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
