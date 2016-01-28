import React, {Component, PropTypes} from 'react';
import moment from 'moment';
import { contextualizePayment } from '../../utils/api';

import { PrettyJson } from 'components';

import classNames from 'classnames/bind';
import styles from './HistoryItem.scss';
const cx = classNames.bind(styles);

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    user: PropTypes.object,
    showJson: PropTypes.func
  };

  toggleLedgerTransfer = (event) => {
    event.preventDefault();

    this.props.showJson(this.props.item.id, this.props.item.transfers[0]);
  }

  render() {
    const item = contextualizePayment(this.props.item, this.props.user);

    const amountClass = item.counterpartyAccount === item.destination_account ? 'negative' : 'positive';

    return (
      <div className={cx('item')}>
        <div className="row">
          <div className="col-sm-8">
            <div className={cx('counterparty')}>{item.counterpartyAccount}</div>
            <div className={cx('date')}>
              <a href="" onClick={this.toggleLedgerTransfer} title="See the ledger payment">{moment(item.created_at).format('LL')}</a>
            </div>
          </div>
          <div className="col-sm-4">
            <div className={cx('amount', amountClass)}>
              {item.source_amount}
            </div>
          </div>
        </div>
        {item.showJson && item.json &&
        <div className="row">
          <div className={cx('col-sm-12', 'jsonContainer')}>
            <PrettyJson json={item.json} />
          </div>
        </div>}
      </div>
    );
  }
}
