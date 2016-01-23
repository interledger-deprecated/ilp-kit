import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as historyActions from 'redux/modules/history';

import { HistoryItem } from 'components';

import styles from './History.scss';

@connect(
  state => ({
    history: state.history.history,
    user: state.auth.user
  }),
  historyActions)
export default class Home extends Component {
  static propTypes = {
    load: PropTypes.func,
    history: PropTypes.array,
    user: PropTypes.object
  }

  // Load the history
  componentDidMount() {
    this.props.load();
  }

  render() {
    const {history, user} = this.props;

    return (
      <div>
        <ul className={styles.list}>
          {history.map((item) => {
            return <li key={item.id}><HistoryItem item={item} user={user} /></li>;
          })}
        </ul>
      </div>
    );
  }
}
