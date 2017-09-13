/* globals location */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Link } from 'react-router-dom'

import classNames from 'classnames/bind'
import styles from './SettlementInfo.scss'

import { get } from 'redux/actions/settlement'

const cx = classNames.bind(styles)

@connect(state => ({
  info: state.settlement.info
}), { get })
export default class SettlementInfo extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired,
    info: PropTypes.object
  }

  state = {}

  componentWillMount () {
    this.props.get(this.props.match.params.id)
  }

  componentDidMount () {
    this.setState({
      hostname: location.hostname  // eslint-disable-line no-restricted-globals
    })
  }

  renderUser () {
    const { info } = this.props

    return (
      <div>
        <h3>
          You've successfully deposited <b>{info.amount} {info.currency}</b> into your account.
        </h3>

        <Link to='/' className={cx('goBack')}>
          Back to home
        </Link>
      </div>
    )
  }

  renderPeer () {
    const { info } = this.props
    const { hostname } = this.state

    return (
      <div>
        <h3>
          <b>{info.amount} {info.currency}</b> settlement between <b>{hostname}</b> and <b>{info.peer}</b> has been completed!
        </h3>

        <a href={`https://${info.peer}`} className={cx('goBack')}>
          Back to {info.peer}
        </a>
      </div>
    )
  }

  render () {
    const { info } = this.props

    return (
      <div className={cx('SettlementInfo')}>
        <i className={cx('fa', 'fa-check', 'icon')} />

        {info.peer && this.renderPeer()}
        {info.user && this.renderUser()}
      </div>
    )
  }
}
