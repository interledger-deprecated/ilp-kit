import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as authActions from 'redux/modules/auth';
import config from '../../config';

import { RegisterForm } from 'components';

import styles from './Register.scss';

@connect(
  state => ({
    user: state.auth.user,
    fail: state.auth.fail
  }),
  authActions)
export default class Register extends Component {
  static propTypes = {
    user: PropTypes.object,
    register: PropTypes.func,
    logout: PropTypes.func,
    fail: PropTypes.object
  }

  // TODO don't show register page if there's an active session
  render() {
    const {register, fail} = this.props;
    return (
      <div className={styles.registerPage + ' container'}>
        <DocumentMeta title={config.app.title + ': Register'}/>
        <div className="col-sm-4">
          <h1>Register</h1>

          <RegisterForm register={register} fail={fail} />
        </div>
      </div>
    );
  }
}
