import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import * as authActions from 'redux/actions/auth'
import { amount } from '../../utils/amount'

import Alert from 'react-bootstrap/lib/Alert'

import { SendForm } from 'containers'
import { History } from 'containers'

import classNames from 'classnames/bind'
import styles from './Home.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    verificationEmailSent: state.auth.verificationEmailSent,
    activeTab: state.auth.activeTab,
    verified: state.auth.verified,
  }),
  authActions)
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    reload: PropTypes.func,

    // User verification
    params: PropTypes.object,
    resendVerificationEmail: PropTypes.func,
    verificationEmailSent: PropTypes.bool,
    verified: PropTypes.bool
  }

  static contextTypes = {
    config: PropTypes.object
  }

  reload = () => {
    this.props.reload({username: this.props.user.username})
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/widget')
  }

  resendVerification = (event) => {
    event.preventDefault()

    this.props.resendVerificationEmail(this.props.user.username)
  }

  render() {
    const {user, verified, verificationEmailSent} = this.props
    const {config} = this.context

    return (
      <div className="row">
        <div className="col-sm-8">
          {/* TODO:UX Invalid verification error */}
          {verified &&
          <Alert bsStyle="success">
            Your email has been verified!
          </Alert>}

          {/* Balance */}
          <div className="panel panel-default">
            <div className="panel-body">
              <div className={cx('balanceContainer')}>
                <div className={cx('balanceDescription')}>Your Balance</div>
                <div className={cx('balance')}>
                  {config.currencySymbol}{amount(user.balance)}
                  {config.reload && <span className={cx('but')}>*</span>}
                </div>
                {config.reload &&
                  <div>
                    <button className="btn btn-complete btn-lg" onClick={this.reload}>Get More</button>
                    <div className={cx('balanceFake')}>* Don't get too excited, this is fake money</div>
                  </div>}
              </div>
            </div>
          </div>
          {/* History */}
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">Payment History</div>
            </div>
            <div className="panel-body">
              <History />
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          {!user.email_verified &&
          <Alert bsStyle="danger">
            An email has been sent to <strong>{user.email}</strong>.
            Please click the link in that message to confirm your email address.&nbsp;
            {!verificationEmailSent && <a href="" onClick={this.resendVerification}>Resend the message</a>}
            {verificationEmailSent && <strong>Verification email sent!</strong>}
          </Alert>}
          {/*
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">Use Five Bells Wallet as your default payment provider</div>
            </div>
            <div className="panel-body">
              <button className="btn btn-complete btn-block" onClick={this.handleDefaultPayment}>Set as default</button>
            </div>
          </div>
          */}
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">Send Money</div>
            </div>
            <div className="panel-body">
              <SendForm />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
