import React, {Component, PropTypes} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import moment from 'moment'
import TimeAgo from 'react-timeago'

import { contextualizePayment } from '../../utils/api'
import { getAccountName } from '../../utils/account'
import { amount } from '../../utils/amount'

import { PrettyJson } from 'components'

import classNames from 'classnames/bind'
import styles from './HistoryItem.scss'
const cx = classNames.bind(styles)

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    user: PropTypes.object,
    toggleJson: PropTypes.func,
    loadTransfers: PropTypes.func
  }

  static contextTypes = {
    config: PropTypes.object
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
    const config = this.context.config || {}
    const { showTransfers } = this.state

    const type = item.counterpartyAccount === item.destination_account ? 'outgoing' : 'incoming'

    const profilePic = (type === 'outgoing' ? item.destination_image_url : item.source_image_url) || require('./placeholder.png')

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
                    {getAccountName(item.counterpartyAccount)}
                  </span></span>}

                  {type === 'incoming' &&
                  <span><span className={cx('counterparty')} title={item.counterpartyAccount}>
                    {getAccountName(item.counterpartyAccount)}
                  </span> paid you</span>}
                </div>
                {item.message &&
                <div className={cx('message')}>
                  {item.message}
                </div>}
                <div className={cx('date')} title={moment(item.recent_date).format('LLL')}>
                  <TimeAgo date={item.recent_date} formatter={this.timeAgoFormatter} />
                </div>
              </div>
            </div>
            <div className="col-xs-4">
              <div className={cx('amount', type)}>
                {/* TODO Show both source and destination amounts */}
                {config.currencySymbol}{type === 'outgoing' ? amount(item.source_amount) : amount(item.destination_amount)}
              </div>

              {item.transfers_count > 1 &&
              <div className={cx('transfersCount')}>
                {!item.transfersLoading &&
                <a href="" onClick={this.toggleTransfers}>
                  {item.transfers_count} transfers
                </a>}

                {item.transfersLoading &&
                <span>Loading...</span>}
              </div>}
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
                <div className="row" key={transfer.source_account + transfer.created_at}>
                  <span className={cx('col-xs-8', 'date')}>
                    {moment(transfer.created_at).format('LLL')}
                  </span>
                  <span className={cx('col-xs-4', 'amount')}>
                    {config.currencySymbol}{type === 'outgoing' ? amount(transfer.source_amount) : amount(transfer.destination_amount)}
                  </span>
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
