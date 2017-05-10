import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import moment from 'moment'
import TimeAgo from 'react-timeago'

import Amount from 'components/Amount/Amount'

import classNames from 'classnames/bind'
import styles from './ActivityWithdrawal.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    advancedMode: state.auth.advancedMode
  }))
export default class ActivityWithdrawal extends Component {
  static propTypes = {
    activity: PropTypes.object.isRequired,
    config: PropTypes.object,
    advancedMode: PropTypes.bool
  }

  static defaultProps = {
    config: {}
  }

  componentWillMount () {
    this.processActivity()
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.activity === nextProps.activity) return

    this.processActivity(nextProps)
  }

  processActivity = (props = this.props) => {
    const withdrawal = props.activity.Withdrawals[0]

    this.setState({
      ...this.state,
      withdrawal
    })
  }

  toggleTransfers = event => {
    this.setState({
      ...this.state,
      showTransfers: !this.state.showTransfers
    })

    event.preventDefault()
  }

  timeAgoFormatter = (value, unit, suffix) => {
    if (unit !== 'second') {
      return [value, unit + (value !== 1 ? 's' : ''), suffix].join(' ')
    }

    if (suffix === 'ago') {
      return 'a few seconds ago'
    }

    if (suffix === 'from now') {
      return 'in a few seconds'
    }
  }

  render () {
    const { config } = this.props
    const { withdrawal } = this.state
    const advancedMode = this.props.advancedMode

    // TODO payments grouping / message
    return (
      <div className={cx('ActivityWithdrawal')}>
        <div className='row row-mobile'>
          <div className='col-xs-8'>
            <i className={cx('fa', 'fa-minus', 'icon')} />
            <div className={cx('description')}>
              {/* TODO:UX include the withdrawal method */}
              <span className={cx('message')}>Withdrawal ({withdrawal.status})</span>
              <div className={cx('date')} title={moment(withdrawal.recent_date).format('LLL')}>
                {advancedMode && <span>{moment(withdrawal.recent_date || withdrawal.created_at).format('MMM D, YYYY LTS')} - </span>}
                <TimeAgo date={withdrawal.recent_date || withdrawal.created_at} formatter={this.timeAgoFormatter} />
              </div>
            </div>
          </div>
          <div className='col-xs-4'>
            <div className={cx('amount')}>
              <Amount amount={withdrawal.amount} currencySymbol={config.currencySymbol} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
