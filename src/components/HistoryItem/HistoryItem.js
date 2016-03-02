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
    toggleJson: PropTypes.func
  };

  toggleLedgerTransfer = (event) => {
    event.preventDefault();

    this.props.toggleJson(this.props.item.id, this.props.item.transfers);
  }

  render() {
    const item = contextualizePayment(this.props.item, this.props.user);

    const amountClass = item.counterpartyAccount === item.destination_account ? 'negative' : 'positive';

    return (
      <div className={cx('item')}>
        <div className="row">
          <div className="col-sm-7">
            <div className={cx('counterparty')}>{item.counterpartyAccount}</div>
            <div className={cx('date')}>
              <span>{moment(item.created_at).format('LL')}</span>
            </div>
          </div>
          <div className="col-sm-4">
            <div className={cx('amount', amountClass)}>
              {/* TODO Show both source and destination amounts */}
              {Math.round(item.source_amount * 100) / 100}
            </div>
          </div>
          <div className={cx('col-sm-1', 'expand')}>
            <a href="" onClick={this.toggleLedgerTransfer} title="View the ledger payment" className={cx('fa', 'fa-file-code-o', {'active': item.showJson})} />
          </div>
        </div>
        {item.showJson && item.json &&
        <div className="row">
          <div className={cx('col-sm-12', 'jsonContainer')}>
            <div>Ledger transaction</div>
            <PrettyJson json={item.json} />
          </div>
        </div>}
      </div>
    );
  }
}
