import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import { Alert } from 'react-bootstrap';
import * as sendActions from 'redux/modules/send';
import config from '../../config';

@connect(
  state => ({
    send: state.send,
    success: state.send.success,
    error: state.send.error
  }),
  sendActions)

export default class Send extends Component {

  static propTypes = {
    transfer: PropTypes.func,
    sending: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.optionalObject
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const recipient = this.refs.recipient.value;
    const amount = this.refs.amount.value;
    const password = this.refs.password.value;
    this.props.transfer(recipient, amount, password);
  }

  render() {
    const { success, error, sending } = this.props;
    console.log('tjis', this.props);
    return (
      <div className="container">
        <h1>Send</h1>
        <DocumentMeta title={config.app.title + ': Send'} />

        <div className="row">
          <div className="col-sm-4">
            {success &&
            <Alert bsStyle="success">
              <strong>Holy guacamole!</strong> You've just sent some money!
            </Alert>}

            {error &&
            <Alert bsStyle="danger">
              <strong>Woops!</strong> Something went wrong
            </Alert>}

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
              <button type="submit" className="btn btn-success" disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
