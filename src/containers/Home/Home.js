import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import * as authActions from 'redux/actions/auth'
import { amount } from '../../utils/amount'

import Alert from 'react-bootstrap/lib/Alert'

import SendForm from 'containers/SendForm/SendForm'
import History from 'containers/History/History'
import Stats from 'containers/Stats/Stats'

import classNames from 'classnames/bind'
import styles from './Home.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    verificationEmailSent: state.auth.verificationEmailSent,
    activeTab: state.auth.activeTab,
    verified: state.auth.verified,
    config: state.auth.config
  }),
  authActions)
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    reload: PropTypes.func,
    config: PropTypes.object,

    // User verification
    params: PropTypes.object,
    resendVerificationEmail: PropTypes.func,
    verificationEmailSent: PropTypes.bool,
    verified: PropTypes.bool
  }

  state = {}

  reload = () => {
    this.setState({
      ...this.state,
      reloading: true
    })

    this.props.reload({ username: this.props.user.username })
      .then(() => {
        this.setState({
          ...this.state,
          reloading: false
        })
      })
      .catch(() => {
        this.setState({
          ...this.state,
          reloading: false
        })
      })
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/widget')
  }

  resendVerification = (event) => {
    event.preventDefault()

    this.props.resendVerificationEmail(this.props.user.username)
  }

  toggleStats = (event) => {
    this.setState({
      ...this.state,
      showStats: !this.state.showStats
    })

    event.preventDefault()

    tracker.track('Toggle Stats')
  }

  render() {
    const { user, verified, verificationEmailSent, config } = this.props
    const { showStats, reloading } = this.state

    // For some reason dynamic routers have problems with that state
    if (!user) return null

    return (
      <div className="row">
        <div className="col-sm-8">
          {/* History */}
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">
                {showStats &&
                <a href="" onClick={this.toggleStats}>Payment History</a>}
                {!showStats &&
                <span>Payment History</span>}
              </div>
              <div className="panel-title pull-right">
                {showStats &&
                <span>Stats</span>}
                {!showStats &&
                <a href="" onClick={this.toggleStats}>Stats</a>}
              </div>
            </div>
            <div className="panel-body">
              {!showStats && <History />}
              {showStats && <Stats />}
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          {/*
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">Use ILP kit as your default payment provider</div>
            </div>
            <div className="panel-body">
              <button className="btn btn-complete btn-block" onClick={this.handleDefaultPayment}>Set as default</button>
            </div>
          </div>
          */}
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
                  {amount(user.balance, config.currencySymbol)}
                  {config.reload && <span className={cx('but')}>*</span>}
                </div>
                {config.reload &&
                <div>
                  <button className="btn btn-complete btn-lg" onClick={this.reload}>
                    {!reloading && 'Get More'}
                    {reloading && 'Getting...'}
                  </button>
                  <div className={cx('balanceFake')}>* Don't get too excited, this is fake money</div>
                </div>}
              </div>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-title">Send Money</div>
            </div>
            <div className="panel-body">
              <SendForm />
            </div>
          </div>
          {!user.email_verified &&
          <Alert bsStyle="danger">
            An email has been sent to <strong>{user.email}</strong>.
            Please follow the steps in the message to confirm your email address.&nbsp;
            {!verificationEmailSent && <a href="" onClick={this.resendVerification}>Resend the message</a>}
            {verificationEmailSent && <strong>Verification email sent!</strong>}
          </Alert>}
        </div>
      </div>
    )
  }
}
