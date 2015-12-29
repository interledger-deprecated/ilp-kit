import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as historyActions from 'redux/modules/history';

import { HistoryItem } from 'components';

import styles from './History.scss';

@connect(
  state => ({
    history: state.history.history
  }),
  historyActions)
export default class Home extends Component {
  static propTypes = {
    load: PropTypes.func,
    history: PropTypes.array
  }

  // Load the history
  componentDidMount() {
    this.props.load();
  }

  render() {
    const {history} = this.props;

    return (
      <div>
        <h3>History</h3>
        <ul className={styles.list}>
          <li className={styles.head}>
            <div className="row">
              <div className="col-sm-3">Sender</div>
              <div className="col-sm-3">Receiver</div>
              <div className="col-sm-3">Sent</div>
              <div className="col-sm-3">Received</div>
            </div>
          </li>
          {history.map((item) => {
            return <li><HistoryItem key={item.id} item={item} /></li>;
          })}
        </ul>
      </div>
    );
  }
}
