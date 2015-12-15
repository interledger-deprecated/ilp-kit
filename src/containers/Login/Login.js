import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as authActions from 'redux/modules/auth';
import config from '../../config';

import { LoginForm } from 'components';

@connect(
  state => ({user: state.auth.user}),
  authActions)
export default class Login extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    logout: PropTypes.func
  }

  render() {
    const {login} = this.props;
    const styles = require('./Login.scss');
    return (
      <div className={styles.loginPage + ' container'}>
        <DocumentMeta title={config.app.title + ': Login'}/>
        <h1>Login</h1>

        <LoginForm login={login} />
      </div>
    );
  }
}
