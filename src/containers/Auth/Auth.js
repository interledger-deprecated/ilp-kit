import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router'
import * as authActions from 'redux/actions/auth'

import Alert from 'react-bootstrap/lib/Alert'

import LoginForm from 'components/LoginForm/LoginForm'
import RegisterForm from 'components/RegisterForm/RegisterForm'
import ForgotPasswordForm from 'components/ForgotPasswordForm/ForgotPasswordForm'
import ChangePasswordForm from 'components/ChangePasswordForm/ChangePasswordForm'

import classNames from 'classnames/bind'
import styles from './Auth.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    authFail: state.auth.fail,
    verified: state.auth.verified,
    config: state.auth.config
  }),
  authActions)
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    authFail: PropTypes.object,
    login: PropTypes.func,
    register: PropTypes.func,
    forgot: PropTypes.func,
    reload: PropTypes.func,
    changeTab: PropTypes.func,
    route: PropTypes.object,
    config: PropTypes.object,

    // User verification
    params: PropTypes.object,
    verified: PropTypes.bool,

    // Password change
    changePassword: PropTypes.func
  }

  componentWillMount() {
    this.setCurrentView()
  }

  componentWillReceiveProps(nextProps) {
    this.setCurrentView(nextProps)
  }

  setCurrentView(props) {
    const prps = props || this.props
    const fullPath = prps.route.path
    let currentView = fullPath && fullPath.match(/[a-zA-Z-]*/i)[0]

    if (currentView === 'verify') currentView = 'login'

    this.setState({
      currentView: currentView || 'login'
    })
  }

  render() {
    const {authFail, login, register, forgot, changePassword, verified, params, config} = this.props
    const {currentView} = this.state

    const appConfig = this.props.config || {}

    return (
      <div className={cx('Auth', 'container')}>
        {/* <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="collapse">
          <li className={currentView === 'login' ? 'active' : ''}>
            <Link to="/login" data-toggle="tab" role="tab" aria-expanded="true">Login</Link>
          </li>
          {config.registration &&
          <li className={currentView === 'register' ? 'active' : ''}>
            <Link to="/register" data-toggle="tab" role="tab" aria-expanded="true">Register</Link>
          </li>}
        </ul> */}
        <div>
          <div className={cx('header')}>
            <h1 className={cx('title')}>{appConfig.title}</h1>
          </div>
          <div className={cx('window')}>
            {verified &&
            <Alert bsStyle="success">
              Your email has been verified!
            </Alert>}

            {currentView === 'login' &&
            <LoginForm login={login} fail={authFail} />}
            {currentView === 'register' &&
            <RegisterForm register={register} fail={authFail} params={params} />}
            {currentView === 'forgot-password' &&
            <ForgotPasswordForm submit={forgot} fail={authFail} />}
            {currentView === 'change-password' &&
            <ChangePasswordForm submit={changePassword} username={params.username} code={params.passwordChangeCode} fail={authFail} />}
          </div>
          {currentView === 'login' && config.githubAuth &&
          <div className={cx('oauthBox', 'clearfix')}>
            <div className="pull-right">
              <a href="/api/auth/github" className="btn btn-primary">Github</a>
            </div>
            <div className="pull-right">Or login using</div>
          </div>}
          {currentView === 'login' &&
          <div className={cx('switchBox')}>
            <span className={cx('label')}>Don't have an account?</span>
            <Link to="/register" data-toggle="tab" role="tab" aria-expanded="true" className={cx('btnSwitch', 'btn', 'btn-default')}>Sign Up</Link>
          </div>}
          {currentView === 'register' &&
          <div className={cx('switchBox')}>
            <span className={cx('label')}>Already have an account?</span>
            <Link to="/login" data-toggle="tab" role="tab" aria-expanded="true" className={cx('btnSwitch', 'btn', 'btn-default')}>Login</Link>
          </div>}
        </div>
      </div>
    )
  }
}
