import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as authActions from 'redux/modules/auth';
import * as sendActions from 'redux/modules/send';

import { LoginForm } from 'components';
import { RegisterForm } from 'components';
import { SendForm } from 'components';
import { History } from 'containers';

import classNames from 'classnames/bind';
import sharedStyles from '../App/Shared.scss';
import inputStyles from '../App/Inputs.scss';
import styles from './Home.scss';
const cx = classNames.bind({...sharedStyles, ...inputStyles, ...styles});

@connect(
  state => ({
    user: state.auth.user,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail,
    path: state.send.path,
    authFail: state.auth.fail,
    activeTab: state.auth.activeTab
  }),
  { ...authActions, ...sendActions }) // TODO this is definitely wrong
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    success: PropTypes.bool,
    fail: PropTypes.object,
    authFail: PropTypes.object,
    transfer: PropTypes.func,
    findPath: PropTypes.func,
    path: PropTypes.object,
    login: PropTypes.func,
    register: PropTypes.func,
    unmount: PropTypes.func,
    reload: PropTypes.func,
    changeTab: PropTypes.func,
    activeTab: PropTypes.string
  }

  reload = () => {
    this.props.reload({username: this.props.user.username});
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/widget');
  }

  handleChangeTab = (tab, event) => {
    event.preventDefault();
    this.props.changeTab(tab);
  }

  render() {
    const {user, success, fail, authFail, transfer, findPath, path, unmount, login, register, activeTab} = this.props;

    return (
      <div>
        {!user &&
        <div className="row">
          <div className="col-xs-12 col-sm-offset-4 col-sm-4">
            <div className={cx('box')}>
              <div className={cx('authTabs', 'clearfix')}>
                {activeTab === 'login' &&
                <span className={cx('authTab', 'active')}>Login</span>}
                {activeTab === 'register' &&
                <a href="" onClick={this.handleChangeTab.bind(this, 'login')} className={cx('authTab')}>Login</a>}
                {activeTab === 'login' &&
                <a href="" onClick={this.handleChangeTab.bind(this, 'register')} className={cx('authTab')}>Register</a>}
                {activeTab === 'register' &&
                <span className={cx('authTab', 'active')}>Register</span>}
              </div>
              {activeTab === 'login' &&
              <LoginForm login={login} fail={authFail} unmount={unmount} />}
              {activeTab === 'register' &&
              <RegisterForm register={register} fail={authFail} unmount={unmount} />}
            </div>
          </div>
        </div>}

        {/* Balance Send widget */}
        {user &&
        <div>
          <div className={cx('box', 'defaultPPBar')}>
            <div className="row">
              <div className={cx('col-xs-3')}>
                <button className={cx('btn', 'lu-btn', 'btn-block')} onClick={this.handleDefaultPayment}>Set as default</button>
              </div>
              <div className={cx('col-xs-9')}>
                (This will use the <a href="https://github.com/justmoon/webpayments-polyfill">webpayments-polyfill</a> to set Five Bells Ledger UI as your default payment provider)
              </div>
            </div>
          </div>
          <div className="row">
            <div className={cx('col-sm-8')}>
              <div className={cx('box')}>
                {/* Balance */}
                <div className={cx('balanceContainer')}>
                  <div className={cx('balanceDescription')}>Your Balance</div>
                  <div className={cx('balance')}>
                    {user.balance}
                    <span className={cx('but')}>*</span>
                  </div>
                  <button className={cx('btn', 'lu-btn')} onClick={this.reload}>Get More</button>
                  <div className={cx('balanceFake')}>* Don't get too excited, this is fake money</div>
                </div>
              </div>
              <div className={cx('box')}>
                <span className={cx('boxTitle')}>Payment history</span>
                {/* History */}
                <History />
              </div>
            </div>
            <div className={cx('col-sm-4')}>
              <div className={cx('box')}>
                <span className={cx('boxTitle')}>Send money</span>
                <SendForm transfer={transfer} findPath={findPath} path={path} unmount={unmount} success={success} fail={fail} />
              </div>
            </div>
          </div>
        </div>}
      </div>
    );
  }
}
