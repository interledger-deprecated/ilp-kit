import React, {Component, PropTypes} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import {connect} from 'react-redux'
import moment from 'moment'
import TimeAgo from 'react-timeago'

import { contextualizePayment } from '../../utils/api'
import { getAccountName } from '../../utils/account'
import { amount } from '../../utils/amount'

import classNames from 'classnames/bind'
import styles from './HistoryItem.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    config: state.auth.config,
    advancedMode: state.auth.advancedMode
  }))
export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    user: PropTypes.object,
    toggleJson: PropTypes.func,
    loadTransfers: PropTypes.func,
    config: PropTypes.object,
    advancedMode: PropTypes.bool
  }

  static defaultProps = {
    config: {}
  }

  state = {
    showTransfers: false
  }

  toggleLedgerTransfer = (event) => {
    event.preventDefault()

    this.props.toggleJson(this.props.item.id, this.props.item.transfers)
    tracker.track('HistoryItem toggle details')
  }

  toggleTransfers = (event) => {
    // TODO show loading
    if (!this.props.item.transfers) {
      this.props.loadTransfers(this.props.item)
    }

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

  render() {
    const item = contextualizePayment(this.props.item, this.props.user)
    const config = this.props.config
    const { showTransfers } = this.state
    const advancedMode = this.props.advancedMode

    const type = item.counterpartyAccount === item.destination_account ? 'outgoing' : 'incoming'

    const profilePic = (type === 'outgoing' ? item.destination_image_url : item.source_image_url) || require('./placeholder.png')

    // TODO payments grouping / message
    return (
      <div className={cx('item')} key={item.time_slot}>
        {/* <a href="" onClick={this.toggleLedgerTransfer} className={cx('link')}> */}
          <div className="row">
            <div className="col-xs-8">
              <img src={profilePic} className={cx('profilePic')} />
              <div className={cx('description')}>
                <div className={cx('counterpartyContainer')}>
                  {type === 'outgoing' &&
                  <span>You paid <span className={cx('counterparty')} title={item.counterpartyAccount}>
                    {item.counterpartyName || getAccountName(item.counterpartyAccount) || 'someone'}
                  </span></span>}

                  {type === 'incoming' &&
                  <span><span className={cx('counterparty')} title={item.counterpartyAccount}>
                    {item.counterpartyName || getAccountName(item.counterpartyAccount) || 'someone'}
                  </span> paid you</span>}
                </div>
                {advancedMode &&
                <a href={item.counterpartyAccount} className={cx('counterpartyAccount')}>
                  {item.counterpartyAccount}
                </a>}
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
                {config.currencySymbol}{type === 'outgoing' ? amount(item.source_amount) : amount(item.destination_amount)}
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
        {/* </a> */}

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
            {item.transfers && item.transfers.map((transfer) => {
              return (
                <div className={cx('row', 'transfer')} key={transfer.source_account + transfer.created_at}>
                  {advancedMode &&
                  <div className="col-xs-2">
                    <a href={config.ledgerUri + '/transfers/' + transfer.transfer} className={cx('hash')}>{transfer.transfer && transfer.transfer.split('-')[0]}</a>
                  </div>}
                  <div className={cx(advancedMode ? 'col-xs-6' : 'col-xs-8', 'date')}>
                    {moment(transfer.created_at).format('MMM D, YYYY LTS')}
                  </div>
                  <div className={cx('col-xs-4', 'amount')}>
                    {config.currencySymbol}{type === 'outgoing' ? amount(transfer.source_amount) : amount(transfer.destination_amount)}
                  </div>
                </div>
              )
            })}
          </div>}
        </ReactCSSTransitionGroup>

        {item.showJson && item.json &&
        <div className="row">
          <div className={cx('col-sm-12', 'jsonContainer')}>
            <div>Ledger transaction</div>
            <PrettyJson json={item.json} />
          </div>
        </div>}
      </div>
    )
  }
}
