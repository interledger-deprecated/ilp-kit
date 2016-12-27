import React, {Component, PropTypes} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import {connect} from 'react-redux'
import moment from 'moment'
import TimeAgo from 'react-timeago'

import { loadTransfers } from 'redux/actions/history'
import { destinationChange, amountsChange } from 'redux/actions/send'

import Amount from '../Amount/Amount'

import { contextualizePayment } from '../../utils/api'
import { getAccountName } from '../../utils/account'

import classNames from 'classnames/bind'
import styles from './HistoryItem.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    advancedMode: state.auth.advancedMode
  }), { loadTransfers, destinationChange, amountsChange })
export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    loadTransfers: PropTypes.func.isRequired,
    config: PropTypes.object,
    advancedMode: PropTypes.bool,
    destinationChange: PropTypes.func.isRequired,
    amountsChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    config: {}
  }

  state = {
    showTransfers: false
  }

  componentWillMount() {
    const item = contextualizePayment(this.props.item, this.props.user)

    this.setState({
      ...this.state,
      item,
      type: item.counterpartyIdentifier === item.destination_identifier ? 'outgoing' : 'incoming'
    })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.item === nextProps.item) return

    const item = contextualizePayment(nextProps.item, nextProps.user)

    this.setState({
      ...this.state,
      item,
      type: item.counterpartyIdentifier === item.destination_identifier ? 'outgoing' : 'incoming',
    })
  }

  toggleTransfers = event => {
    if (!this.props.item.transfers) {
      this.props.loadTransfers(this.props.item)
    }

    setTimeout(() => { // because componentWillReceiveProps also calls setState and overrides this
      this.setState({
        ...this.state,
        showTransfers: !this.state.showTransfers
      })
    }, 50)

    event.preventDefault()
  }

  handleCounterpartyClick = e => {
    e.preventDefault()

    this.props.destinationChange(this.state.item.counterpartyIdentifier)
  }

  handleAmountClick = e => {
    e.preventDefault()

    this.props.amountsChange(this.state.type === 'outgoing' ? this.state.item.source_amount : this.state.item.destination_amount, null)
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

  render() {
    const config = this.props.config
    const { showTransfers, item, type } = this.state
    const advancedMode = this.props.advancedMode

    const profilePic = (type === 'outgoing' ? item.destination_image_url : item.source_image_url) || require('./placeholder.png')
    const paymentAmount = type === 'outgoing' ? item.source_amount : item.destination_amount

    // TODO payments grouping / message
    return (
      <div className={cx('item')} key={item.time_slot}>
        <div className="row">
          <div className="col-xs-8">
            <img src={profilePic} className={cx('profilePic')} />
            <div className={cx('description')}>
              <div className={cx('counterpartyContainer')}>
                {type === 'outgoing' &&
                <span>
                  You paid <a href=""
                              className={cx('counterparty')} title={item.counterpartyIdentifier}
                              onClick={this.handleCounterpartyClick}>
                    {item.counterpartyName || getAccountName(item.counterpartyIdentifier) || 'someone'}
                  </a>
                </span>}

                {type === 'incoming' &&
                <span>
                  <a href="" className={cx('counterparty')}
                     title={item.counterpartyIdentifier}
                     onClick={this.handleCounterpartyClick}>
                    {item.counterpartyName || getAccountName(item.counterpartyIdentifier) || 'someone'}
                  </a> paid you
                </span>}
              </div>
              {advancedMode &&
              <span className={cx('counterpartyIdentifier')}>{item.counterpartyIdentifier}</span>}
              {item.message &&
              <div className={cx('message')}>
                {item.message}
              </div>}
              <div className={cx('date')} title={moment(item.recent_date).format('LLL')}>
                {advancedMode && <span>{moment(item.recent_date || item.created_at).format('MMM D, YYYY LTS')} - </span>}
                <TimeAgo date={item.recent_date || item.created_at} formatter={this.timeAgoFormatter} />
              </div>
            </div>
          </div>
          <div className="col-xs-4">
            <div className={cx('amount', type)}>
              {/* TODO Show both source and destination amounts */}
              <Amount amount={paymentAmount} currencySymbol={config.currencySymbol} />
            </div>

            <div className={cx('transfersCount')}>
              {!item.transfersLoading &&
              <a href="" onClick={this.toggleTransfers}>
                {item.transfers_count > 1 ? item.transfers_count + ' transfers' : '1 transfer'}
              </a>}

              {item.transfersLoading &&
              <span>Loading...</span>}
            </div>
          </div>
        </div>

        <ReactCSSTransitionGroup
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
          component="div"
          className={cx('row', 'transfersContainer')}>
          {showTransfers &&
          <div className={cx('col-sm-12')} key={item.time_slot + 'transfers'}>
            {item.transfers && item.transfers.map(transfer => {
              return (
                <div className={cx('row', 'transfer')} key={transfer.source_identifier + transfer.created_at}>
                  {advancedMode &&
                  <div className="col-xs-2">
                    <a href={config.ledgerUri + '/transfers/' + transfer.transfer} className={cx('hash')}>{transfer.transfer && transfer.transfer.split('-')[0]}</a>
                  </div>}
                  <div className={cx(advancedMode ? 'col-xs-6' : 'col-xs-8', 'date')}>
                    {moment(transfer.created_at).format('MMM D, YYYY LTS')}
                  </div>
                  <div className={cx('col-xs-4', 'amount')}>
                    <Amount amount={paymentAmount} currencySymbol={config.currencySymbol} />
                  </div>
                </div>
              )
            })}
          </div>}
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}
