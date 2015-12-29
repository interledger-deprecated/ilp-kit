import React, {Component, PropTypes} from 'react';

export default class HistoryItem extends Component {
  static propTypes = {
    item: PropTypes.object
  };

  render() {
    const { item } = this.props;

    return (
      <div className="row">
        <div className="col-sm-3">{item.source_user}</div>
        <div className="col-sm-3">{item.destination_account}</div>
        <div className="col-sm-3">{item.source_amount}</div>
        <div className="col-sm-3">{item.destination_amount}</div>
      </div>
    );
  }
}
