import React, {Component, PropTypes} from 'react';
import moment from 'moment';
import { contextualizePayment } from '../../utils/api';

import classNames from 'classnames/bind';
import styles from './HistoryItem.scss';
const cx = classNames.bind(styles);

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    user: PropTypes.object
  };

  render() {
    const item = contextualizePayment(this.props.item, this.props.user);

    const amountClass = item.counterpartyAccount === item.destination_account ? 'negative' : 'positive';

    return (
      <div className={cx('item', 'row')}>
        <div className="col-sm-8">
          <div className={cx('counterparty')}>{item.counterpartyAccount}</div>
          <div className={cx('date')}>{moment(item.created_at).format('LL')}</div>
        </div>
        <div className="col-sm-4">
          <div className={cx('amount', amountClass)}>
            {item.source_amount}
          </div>
        </div>
      </div>
    );
  }
}
