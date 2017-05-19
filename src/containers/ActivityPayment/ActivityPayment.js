import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'
import {connect} from 'react-redux'
import moment from 'moment'
import TimeAgo from 'react-timeago'
import _ from 'lodash'
import AnimateOnChange from 'react-animate-on-change'

import { destinationChange, amountsChange } from 'redux/actions/send'

import AnimateEnterLeave from 'components/AnimateEnterLeave/AnimateEnterLeave'
import Amount from 'components/Amount/Amount'

import { contextualizePayment } from '../../utils/api'
import { getAccountName } from '../../utils/account'

import classNames from 'classnames/bind'
import styles from './ActivityPayment.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    advancedMode: state.auth.advancedMode
  }), { destinationChange, amountsChange })
export default class ActivityPayment extends Component {
  static propTypes = {
    activity: PropTypes.object.isRequired,
    config: PropTypes.object,
    advancedMode: PropTypes.bool,
    destinationChange: PropTypes.func.isRequired,
    amountsChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    config: {}
  }

  state = {
    showTransfers: false
  }

  componentWillMount () {
    this.processActivity()
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.activity === nextProps.activity) return

    this.processActivity(nextProps, true)
  }

  componentWillUnmount () {
    clearInterval(this.streamInterval)
  }

  isActiveStream = (props = this.props) => {
    // Not a stream
    if (!props.activity.stream_id) return

    // TODO:UX how about looking at the distance between payments in the stream
    // to determine how many seconds we should wait before calling it a night
    // instead of waiting 10 hardcoded seconds
    return moment(props.activity.updated_at).add(10, 'second').isAfter(new Date())
  }

  processStream = (props = this.props) => {
    // Not a stream
    if (!props.activity.stream_id) return

    const isActiveStream = this.isActiveStream(props)

    // Stream status didn't change
    if (this.state.isActiveStream === isActiveStream) return

    // do async setState to not mess up other setStates in the process
    setTimeout(() => {
      this.setState({
        ...this.state,
        isActiveStream
      })
    }, 10)

    // keep the isActiveStream in sync
    clearInterval(this.streamInterval)
    if (isActiveStream) {
      this.streamInterval = setInterval(() => {
        this.processStream()
      }, 5000)
    }
  }

  processActivity = (props = this.props, update) => {
    const firstPayment = props.activity.Payments[0]

    const sourceAmount = _.reduce(props.activity.Payments, (sum, payment) => {
      return sum + payment.source_amount
    }, 0)

    const destinationAmount = _.reduce(props.activity.Payments, (sum, payment) => {
      return sum + payment.destination_amount
    }, 0)

    const payment = contextualizePayment({
      source_identifier: firstPayment.source_identifier,
      destination_identifier: firstPayment.destination_identifier,
      source_amount: sourceAmount,
      source_name: firstPayment.source_name,
      source_image_url: firstPayment.source_image_url,
      destination_amount: destinationAmount,
      destination_name: firstPayment.destination_name,
      destination_image_url: firstPayment.destination_image_url,
      message: firstPayment.message,
      // TODO:BEFORE_DEPLOY should this be first payment or last payment
      recent_date: firstPayment.created_at,
      transfers: props.activity.Payments
    }, props.user)

    // Handle the stream
    this.processStream(props)

    this.setState({
      ...this.state,
      payment,
      type: payment.counterpartyIdentifier === payment.destination_identifier ? 'outgoing' : 'incoming',
      updating: update && true
    })

    update && setTimeout(() => {
      this.setState({
        ...this.state,
        updating: false
      })
    }, 200)
  }

  toggleTransfers = event => {
    this.setState({
      ...this.state,
      showTransfers: !this.state.showTransfers
    })

    event.preventDefault()
  }

  handleCounterpartyClick = e => {
    e.preventDefault()

    this.props.destinationChange(this.state.payment.counterpartyIdentifier)
  }

  handleAmountClick = e => {
    e.preventDefault()

    this.props.amountsChange(this.state.type === 'outgoing' ? this.state.payment.source_amount : this.state.payment.destination_amount, null)
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
    const config = this.props.config
    const { showTransfers, isActiveStream, payment, type } = this.state
    const advancedMode = this.props.advancedMode

    const profilePic = (type === 'outgoing' ? payment.destination_image_url : payment.source_image_url) || require('../../../static/placeholder.png')
    const paymentAmount = type === 'outgoing' ? payment.source_amount : payment.destination_amount

    // TODO payments grouping / message
    return (
      <div className={cx('ActivityPayment')}>
        <div className='row row-mobile'>
          <div className='col-xs-8'>
            <img src={profilePic} className={cx('profilePic')} />
            <div className={cx('description')}>
              <div className={cx('counterpartyContainer')}>
                {type === 'outgoing' &&
                <span>
                  You paid <a href=''
                    className={cx('counterparty')} title={payment.counterpartyIdentifier}
                    onClick={this.handleCounterpartyClick}>
                    {payment.counterpartyName || getAccountName(payment.counterpartyIdentifier) || 'someone'}
                  </a>
                </span>}

                {type === 'incoming' &&
                <span>
                  <a href='' className={cx('counterparty')}
                    title={payment.counterpartyIdentifier}
                    onClick={this.handleCounterpartyClick}>
                    {payment.counterpartyName || getAccountName(payment.counterpartyIdentifier) || 'someone'}
                  </a> paid you
                </span>}
              </div>
              {advancedMode &&
              <span className={cx('counterpartyIdentifier')}>{payment.counterpartyIdentifier}</span>}
              {payment.message &&
              <div className={cx('message')}>
                {payment.message}
              </div>}
              <div className={cx('date')} title={moment(payment.recent_date).format('LLL')}>
                {advancedMode && <span>{moment(payment.recent_date || payment.created_at).format('MMM D, YYYY LTS')} - </span>}
                <TimeAgo date={payment.recent_date || payment.created_at} formatter={this.timeAgoFormatter} />
              </div>
            </div>
          </div>
          <div className='col-xs-4'>
            {isActiveStream && <i className={cx('fa', 'fa-refresh', 'fa-spin', 'activeStream')} />}
            {/* TODO Show both source and destination amounts */}
            <AnimateOnChange
              baseClassName={cx('amount', type)}
              animationClassName={cx('updating')}
              animate={!!this.state.updating}>
              <Amount amount={paymentAmount} currencySymbol={config.currencySymbol} />
            </AnimateOnChange>

            <div className={cx('transfersCount')}>
              <a href='' onClick={this.toggleTransfers}>
                {payment.transfers.length > 1 ? payment.transfers.length + ' transfers' : '1 transfer'}
              </a>
            </div>
          </div>
        </div>

        <CSSTransitionGroup
          transitionName={{
            enter: cx('enter'),
            enterActive: cx('enterActive'),
            leave: cx('leave'),
            leaveActive: cx('leaveActive'),
            appear: cx('appear'),
            appearActive: cx('appearActive')
          }}
          transitionAppear
          transitionAppearTimeout={300}
          transitionEnterTimeout={300}
          transitionLeaveTimeout={300}
          component='div'
          className={cx('row', 'row-mobile', 'transfersContainer')}>
          {showTransfers &&
          <div className={cx('col-sm-12')}>
            <AnimateEnterLeave>
            {payment.transfers && payment.transfers.map(transfer => {
              return (
                <div className={cx('row', 'transfer')} key={transfer.source_identifier + transfer.created_at}>
                  {advancedMode &&
                  <div className='col-xs-2'>
                    <a href={config.ledgerUri + '/transfers/' + transfer.transfer} className={cx('hash')}>{transfer.transfer && transfer.transfer.split('-')[0]}</a>
                  </div>}
                  <div className={cx(advancedMode ? 'col-xs-6' : 'col-xs-8', 'date')}>
                    {moment(transfer.created_at).format('MMM D, YYYY LTS')}
                  </div>
                  <div className={cx('col-xs-4', 'amount')}>
                    <Amount amount={type === 'outgoing' ? transfer.source_amount : transfer.destination_amount} currencySymbol={config.currencySymbol} />
                  </div>
                </div>
              )
            })}
            </AnimateEnterLeave>
          </div>}
        </CSSTransitionGroup>
      </div>
    )
  }
}
