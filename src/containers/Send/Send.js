import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import {reduxForm} from 'redux-form';
import * as sendActions from 'redux/modules/send';
import config from '../../config';

import { SendForm } from 'components';

@connect(
  state => ({
    send: state.send,
    success: state.send.success,
    error: state.send.error
  }),
  sendActions)

export default class Send extends Component {

  static propTypes = {
    transfer: PropTypes.func
  }

  render() {
    const {success, error, transfer} = this.props;

    return (
      <div className="container">
        <h1>Send</h1>
        <DocumentMeta title={config.app.title + ': Send'} />

        <SendForm transfer={transfer} success={success} error={error} />
      </div>
    );
  }
}
