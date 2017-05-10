import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {Link} from 'react-router'

import { load as loadPeers } from 'redux/actions/peer'

import classNames from 'classnames/bind'
import styles from './Onboarding.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    peers: state.peer.list,
    peersLoaded: state.peer.loaded
  }),
  { loadPeers })
export default class Onboarding extends Component {
  static propTypes = {
    user: PropTypes.object,
    peers: PropTypes.array,
    loadPeers: PropTypes.func,
    peersLoaded: PropTypes.bool
  }

  state = {}

  componentWillMount () {
    if (!this.props.peersLoaded) {
      this.props.loadPeers()
    }
  }

  render () {
    const { user, peers, peersLoaded } = this.props

    if (!user.isAdmin) return null
    if (!peersLoaded || peers.length > 0) return null

    return (
      <div className={cx('panel', 'panel-default', 'Onboarding')}>
        <div className='panel-body'>
          <h1>Welcome to ILP Kit</h1>

          <ul className={cx('list')}>
            <li>
              <i className={cx('fa', 'fa-check', 'done')} />
              <h3 className={cx('title')}>Set up your ILP Kit</h3>
              <div className={cx('description')}>If you can see this message then you’ve already done this step, but we thought this list should start with a check mark ;)</div>
            </li>
            <li>
              <i className={cx('fa', 'fa-times', 'todo')} />
              <h3 className={cx('title')}>
                <Link to='/peers'>Connect with other ledgers</Link>
              </h3>
              <div className={cx('description')}>Set up connections with other participants, allocate credit lines and the settlement currency</div>
            </li>
            {/* <li>
              <i className={cx('fa', 'fa-times', 'todo')} />
              <h3 className={cx('title')}>
                <Link to="/settlement">Connect your external accounts</Link>
              </h3>
              <div className={cx('description')}>Link your PayPal, Bitcoin, Ripple or Ethereum accounts so peers can send you money</div>
            </li>
            <li>
              <i className={cx('fa', 'fa-times', 'todo')} />
              <h3 className={cx('title')}>
                <Link to="/settings">Complete your profile</Link>
              </h3>
              <div className={cx('description')}>Tell your users who you are - name, email, profile picture, etc.</div>
            </li> */}
          </ul>
        </div>
      </div>
    )
  }
}
