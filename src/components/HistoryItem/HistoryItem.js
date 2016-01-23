import React, {Component, PropTypes} from 'react';
import moment from 'moment';
import { contextualizePayment } from '../../utils/api';

import styles from './HistoryItem.scss';

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    user: PropTypes.object
  };

  render() {
    const item = contextualizePayment(this.props.item, this.props.user);

    const amountClass = item.counterpartyAccount === item.destination_account ? 'negative' : 'positive';

    return (
      <div className={styles.item + ' row'}>
        <div className="col-sm-8">
          <div className={styles.counterparty}>{item.counterpartyAccount}</div>
          <div className={styles.date}>{moment(item.created_at).format('LL')}</div>
        </div>
        <div className="col-sm-4">
          <div className={styles.amount + ' ' + styles[amountClass]}>
            {item.source_amount}
          </div>
        </div>
      </div>
    );
  }
}
