import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as authActions from 'redux/modules/auth';
import * as sendActions from 'redux/modules/send';
import { isLoaded as isAuthLoaded, load as loadAuth } from 'redux/modules/auth';
import connectData from 'helpers/connectData';

import { SendForm } from 'components';
import { LoginForm } from 'components';

import styles from './Widget.scss';

function fetchData(getState, dispatch) {
  const promises = [];
  if (!isAuthLoaded(getState())) {
    promises.push(dispatch(loadAuth()));
  }
  return Promise.all(promises);
}

@connectData(fetchData)
@connect(
  state => ({
    user: state.auth.user,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail,
    loginFail: state.auth.fail
  }),
  // Is this cool? Seems like it could be a bad idea
  { ...authActions, ...sendActions })
export default class Widget extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    location: PropTypes.object,
    loginFail: PropTypes.object,

    transfer: PropTypes.func,
    unmount: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.string
  }

  handleClose = (event) => {
    event.preventDefault();
    parent.postMessage('close', '*');
  }

  render() {
    let accountName = this.props.location.query.account.split('/');
    accountName = accountName[accountName.length - 1];
    const data = {
      currencyCode: this.props.location.query.currencyCode,
      amount: this.props.location.query.amount,
      account: this.props.location.query.account,
      accountName: accountName
    };

    const { user, login, success, fail, loginFail, transfer, unmount } = this.props;

    return (
      <div>
        <div className={styles.before}></div>
        <div className={styles.container}>
          <a href="" className={'fa fa-close ' + styles.close} onClick={this.handleClose}> </a>
          <div className={styles.title}>LedgerUI.com</div>
          <div className={styles.description}>
            So you wanna pay {data.currencyCode} {data.amount} to {data.accountName}
          </div>

          {user &&
          <SendForm
            transfer={transfer}
            unmount={unmount}
            success={success}
            fail={fail}
            type="widget"
            data={data}
          />}

          {!user &&
          <LoginForm login={login} fail={loginFail} type="widget" />}
        </div>
      </div>
    );
  }
}
