import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { routeActions } from 'react-router-redux'

import classNames from 'classnames/bind'
import styles from './Settle.scss'
const cx = classNames.bind(styles)

import { get, settle } from 'redux/actions/peer'

@connect(state => ({
  peer: state.peer.peer
}), { get, settle })
export default class Settle extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired,
    peer: PropTypes.object
  }

  state = {}

  componentWillMount() {
    this.props.get(this.props.params.destination)
  }

  componentDidMount() {
    this.setState({
      hostname: location.hostname
    })
  }

  handleSettle = e => {
    e.preventDefault()

    if (!this.refs.amount.value || parseInt(this.refs.amount.value) < 1) return

    // TODO handle exceptions
    this.props.settle(this.props.params.destination, {amount: this.refs.amount.value})
      .then(response => {
        location.href = response.approvalLink
      })
  }

  render() {
    const { peer, params, location } = this.props
    const { hostname } = this.state

    const initialAmount = (location.query && location.query.amount) || 0

    return (
      <div>
        <h3 className={cx('title')}>
          <div>You are trying to settle the trustline</div>
          <div>between <b>{hostname}</b> and <b>{peer.hostname}</b></div>
          <div>using <b>{params.method}</b>.</div>
        </h3>

        <form onSubmit={this.handleSettle} className={cx('inputBox')}>
          <label>
            <div>Amount</div>
            <input type="text" ref="amount" className={cx('amountField')} defaultValue={initialAmount} />
          </label>
          <div>
            <button type="submit" className={cx('btn', 'btn-success', 'btn-lg')}>Make a Payment</button>
          </div>
        </form>
      </div>
    )
  }
}
