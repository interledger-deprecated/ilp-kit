import React, {Component, PropTypes} from 'react'
import moment from 'moment'

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
    toggleJson: PropTypes.func
  }

  static contextTypes = {
    config: PropTypes.object
  }

  toggleLedgerTransfer = (event) => {
    event.preventDefault()

    this.props.toggleJson(this.props.item.id, this.props.item.transfers)
    tracker.track('HistoryItem toggle details')
  }

  render() {
    const item = contextualizePayment(this.props.item, this.props.user)
    const config = this.context.config || {}

    const type = item.counterpartyAccount === item.destination_account ? 'outgoing' : 'incoming'

    const profilePic = (type === 'outgoing' ? item.destinationUserProfilePicture : item.sourceUserProfilePicture) || require('./placeholder.png')

    return (
      <div className={cx('item')}>
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
                  {moment(item.recent_date).fromNow()}
                </div>
              </div>
            </div>
            <div className="col-xs-4">
              <div className={cx('amount', type)}>
                {/* TODO Show both source and destination amounts */}
                {config.currencySymbol}{type === 'outgoing' ? amount(item.source_amount) : amount(item.destination_amount)}
              </div>
              {item.transfers > 1 &&
              <div className={cx('transfers')}>
                {item.transfers} transfers
              </div>}
            </div>
          </div>
        {/* </a> */}
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
