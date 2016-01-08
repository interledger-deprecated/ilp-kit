import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as authActions from 'redux/modules/auth';
import config from '../../config';

import { LoginForm } from 'components';

import styles from './Login.scss';

@connect(
  state => ({
    user: state.auth.user,
    fail: state.auth.fail
  }),
  authActions)
export default class Login extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    logout: PropTypes.func,
    fail: PropTypes.object
  }

  // TODO don't show login page if there's an active session
  render() {
    const {login, fail} = this.props;
    return (
      <div className={styles.loginPage + ' container'}>
        <DocumentMeta title={config.app.title + ': Login'}/>
        <div className="col-sm-4">
          <h1>Login</h1>

          <LoginForm login={login} fail={fail} />
        </div>
      </div>
    );
  }
}
