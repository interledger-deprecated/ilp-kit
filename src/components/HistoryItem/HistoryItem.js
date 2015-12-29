import React, {Component, PropTypes} from 'react';

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object
  };

  render() {
    const { item } = this.props;

    return (
      <div>
        {item.source_amount}
      </div>
    );
  }
}
