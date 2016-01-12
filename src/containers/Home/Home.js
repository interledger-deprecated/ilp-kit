import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as authActions from 'redux/modules/auth';
import * as sendActions from 'redux/modules/send';

import { SendForm } from 'components';
import { History } from 'containers';

import styles from './Home.scss';

@connect(
  state => ({
    user: state.auth.user,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail
  }),
  { ...authActions, ...sendActions }) // TODO this is definitely wrong
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    success: PropTypes.bool,
    fail: PropTypes.object,
    transfer: PropTypes.func,
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
    const {user, success, fail, transfer, unmount} = this.props;

    return (
      <div>
        {!user &&
        <div className="jumbotron">
          <h1>Make me the default</h1>
          <p className="lead">Some text about settings this payment provider as your default</p>
          <button className="btn btn-lg btn-success" onClick={this.handleDefaultPayment}>Make me your default payment provider</button>
        </div>}

        {/* Balance Send widget */}
        {user &&
        <div className="row">
          <div className={styles.balanceContainer + ' col-sm-6'}>
            <div className={styles.balanceDescription}>Balance</div>
            <div className={styles.balance}>
              {user.balance}
            </div>
            <button className="btn btn-primary" onClick={this.reload}>Get More</button>

            <hr />
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
