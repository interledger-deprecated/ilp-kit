import React, {Component} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as sendActions from 'redux/modules/send';
import config from '../../config';

@connect(
  state => ({send: state.send}),
  sendActions)

export default class Send extends Component {

  handleSubmit = (event) => {
    console.log('this.props', this.props);

    event.preventDefault();
    const recipient = this.refs.recipient.value;
    const amount = this.refs.amount.value;
    const password = this.refs.password.value;
    this.props.send(recipient, amount, password);
  }

  render() {
    return (
      <div className="container">
        <h1>Send</h1>
        <DocumentMeta title={config.app.title + ': Send'} />

        <div className="row">
          <div className="col-sm-4">
            <form onSubmit={this.handleSubmit}>
              <div className="form-group">
                <label>Recipient</label>
                <input type="text" ref="recipient" className="form-control" />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="text" ref="amount" className="form-control" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" ref="password" className="form-control" />
              </div>
              <button type="submit" className="btn btn-success">Send</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
