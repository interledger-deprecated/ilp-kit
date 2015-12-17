import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import * as sendActions from 'redux/modules/send';

import { SendForm } from 'components';

import styles from './Home.scss';

@connect(
  state => ({
    user: state.auth.user,
    send: state.send,
    success: state.send.success,
    fail: state.send.fail
  }),
  sendActions)
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    success: PropTypes.bool,
    fail: PropTypes.string,
    transfer: PropTypes.func
  }

  getMore = () => {
    // TODO
  }

  render() {
    const {user, success, fail, transfer} = this.props;

    return (
      <div>
        {!user &&
        <div className="jumbotron">
          <h1>Make me the default</h1>
          <p className="lead">Some text about settings this payment provider as your default</p>
          <button className="btn btn-lg btn-success" onClick={this.handleDefaultPayment}>Make me your default payment provider</button>
        </div>}

        {user &&
        <div className="row">
          <div className={styles.balanceContainer + ' col-sm-6'}>
            <div className={styles.balanceDescription}>Balance</div>
            <div className={styles.balance}>
              {user.balance}
            </div>
            {/* <button className="btn btn-lg btn-primary" onClick={this.getMore}>Get More</button> */}
          </div>
          <div className="col-sm-6">
            <SendForm transfer={transfer} success={success} fail={fail} />
          </div>
        </div>}
      </div>
    );
  }
}
