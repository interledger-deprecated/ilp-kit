import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as authActions from 'redux/actions/auth';
import * as sendActions from 'redux/actions/send';
import { isLoaded as isAuthLoaded, load as loadAuth } from 'redux/actions/auth';
import connectData from 'helpers/connectData';

import { SendForm } from 'components';
import { LoginForm } from 'components';

import classNames from 'classnames/bind';
import styles from './Widget.scss';
const cx = classNames.bind(styles);

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
    path: state.send.path,
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
    findPath: PropTypes.func,
    path: PropTypes.object,
    // TODO there are two unmount functions. One in authActions one in sendActions
    unmount: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.object
  }

  componentDidMount() {
    // TODO find a better place for this
    if (document) {
      document.body.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
  }

  // TODO should also close on ESC
  handleClose = (event) => {
    event.preventDefault();
    parent.postMessage('close', '*');
  }

  render() {
    let destinationName = this.props.location.query.account.split('/');
    destinationName = destinationName[destinationName.length - 1];
    const data = {
      currencyCode: this.props.location.query.currencyCode,
      destinationAmount: this.props.location.query.amount,
      destination: this.props.location.query.account
    };

    const { user, login, success, fail, loginFail, transfer, findPath, path, unmount } = this.props;

    return (
      <div>
        <div className={cx('before')}></div>
        <div className={cx('container')}>
          <a href="" className={cx('fa', 'fa-close', 'close')} onClick={this.handleClose}> </a>
          <div className={cx('title')}>LedgerUI.com</div>
          <div className={cx('description')}>
            So you wanna pay {data.currencyCode} {data.amount} to {destinationName}
          </div>

          {user &&
          <SendForm
            transfer={transfer}
            findPath={findPath}
            path={path}
            unmount={unmount}
            success={success}
            fail={fail}
            type="widget"
            data={data}
          />}

          {!user &&
          <LoginForm login={login} fail={loginFail} unmount={unmount} type="widget" />}
        </div>
      </div>
    );
  }
}
