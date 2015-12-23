import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as historyActions from 'redux/modules/history';

import { HistoryItem } from 'components';

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
  componentWillMount() {
    this.props.load();
  }

  render() {
    const {history} = this.props;

    return (
      <div>
        <h3>History</h3>
        <ul>
          {history.map((item) => {
            return <HistoryItem item={item} />;
          })}
        </ul>
      </div>
    );
  }
}
