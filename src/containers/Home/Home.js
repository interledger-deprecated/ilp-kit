import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as authActions from 'redux/modules/auth';
import * as sendActions from 'redux/modules/send';

import { RegisterForm } from 'components';
import { SendForm } from 'components';
import { History } from 'containers';

import classNames from 'classnames/bind';
import styles from './Home.scss';
const cx = classNames.bind(styles);

@connect(
  state => ({
    user: state.auth.user,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail,
    registerFail: state.auth.fail
  }),
  { ...authActions, ...sendActions }) // TODO this is definitely wrong
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    success: PropTypes.bool,
    fail: PropTypes.object,
    registerFail: PropTypes.object,
    transfer: PropTypes.func,
    register: PropTypes.func,
    unmount: PropTypes.func,
    reload: PropTypes.func
  }

  reload = () => {
    this.props.reload({username: this.props.user.username});
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/widget');
  }

  render() {
    const {user, success, fail, registerFail, transfer, unmount, register} = this.props;
    const family = require('./family.jpg');

    return (
      <div>
        {!user &&
        <div className="row">
          <div className="col-xs-9">
            <img src={family}/>
          </div>
          <div className="col-xs-3">
            <h1>Register</h1>
            <RegisterForm register={register} fail={registerFail} unmount={unmount} />
          </div>
        </div>}

        {/* Balance Send widget */}
        {user &&
        <div className="row">
          <div className="jumbotron">
            <h1>Make me the default</h1>
            <p className="lead">Some text about settings this payment provider as your default</p>
            <button className="btn btn-lg btn-success" onClick={this.handleDefaultPayment}>Make me your default payment provider</button>
          </div>
          <div className="col-sm-6">
            {/* Balance */}
            <div className={cx('balanceContainer')}>
              <div className={cx('balanceDescription')}>Your Balance</div>
              <div className={cx('balance')}>
                {user.balance}
              </div>
              <button className="btn btn-primary" onClick={this.reload}>Get More</button>

              <hr />
            </div>

            {/* History */}
            <History />
          </div>
          <div className="col-sm-6">
            <SendForm transfer={transfer} unmount={unmount} success={success} fail={fail} />
          </div>
        </div>}
      </div>
    );
  }
}
