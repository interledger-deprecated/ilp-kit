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

    if (!this.refs.amount.value) return

    // TODO handle exceptions
    this.props.settle(this.props.params.destination, {amount: this.refs.amount.value})
      .then(response => {
        location.href = response.approvalLink
      })
  }

  render() {
    const { peer, params } = this.props
    const { hostname } = this.state

    return (
      <div>
        <div className={cx('title')}>
          You're trying to settle the trustline between <b>{hostname}</b> and <b>{peer.hostname}</b> using <b>{params.method}</b>.
        </div>

        <form onSubmit={this.handleSettle} className={cx('inputBox')}>
          <label>
            Amount
            <input type="text" ref="amount" className={cx('form-control')} />
          </label>
          <div>
            <button type="submit" className={cx('btn', 'btn-success')}>Settle</button>
          </div>
        </form>
      </div>
    )
  }
}
