import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import moment from 'moment'

import { loadStats } from 'redux/actions/stats'

import classNames from 'classnames/bind'
import styles from './Stats.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    stats: state.stats.list
  }),
  {loadStats})
export default class Home extends Component {
  static propTypes = {
    loadStats: PropTypes.func,
    stats: PropTypes.array
  }

  componentDidMount () {
    this.props.loadStats()
  }

  renderStat = (stat, key) => {
    return (
      <div className={cx('stat')} key={key}>
        <span className={cx('sourceName')}>{stat.source_name}</span>
        <span className={cx('destinationName')}>{stat.destination_name}</span>
        <span className={cx('sourceAmount')}>{stat.source_amount}</span>
        <span className={cx('destinationAmount')}>{stat.destination_amount}</span>
        <span className={cx('transfersCount')}>{stat.transfers_count}</span>
        <span className={cx('recentDate')}>{moment(stat.recent_date).format('L')}</span>
      </div>
    )
  }

  render () {
    const { stats } = this.props

    return (
      <div>
        <div className={cx('stat', 'header')}>
          <span className={cx('sourceName')}>Sender</span>
          <span className={cx('destinationName')}>Recipient</span>
          <span className={cx('sourceAmount')}>Sender Amount</span>
          <span className={cx('destinationAmount')}>Recipient Amount</span>
          <span className={cx('transfersCount')}>Total Payments</span>
          <span className={cx('recentDate')}>Recent Payment</span>
        </div>
        {stats.map((stat, index) => {
          return this.renderStat(stat, index)
        })}
      </div>
    )
  }
}
