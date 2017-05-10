import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {Link} from 'react-router'
import * as authActions from 'redux/actions/auth'
import { routeActions } from 'react-router-redux'

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
  {...authActions, pushState: routeActions.push})
export default class Home extends Component {
  static propTypes = {
    authFail: PropTypes.object,
    login: PropTypes.func,
    register: PropTypes.func,
    forgot: PropTypes.func,
    config: PropTypes.object,
    pushState: PropTypes.func.isRequired,

    // User verification
    params: PropTypes.object,
    verified: PropTypes.bool,

    // Password change
    changePassword: PropTypes.func
  }

  componentWillMount () {
    this.setCurrentView()
  }

  componentWillReceiveProps (nextProps) {
    this.setCurrentView(nextProps)
  }

  setCurrentView (props) {
    const prps = props || this.props
    const fullPath = prps.route.path
    let currentView = fullPath && fullPath.match(/[a-zA-Z-]*/i)[0]

    if (currentView === 'verify') currentView = 'login'

    this.setState({
      currentView: currentView || 'login'
    })
  }

  goBack = e => {
    e && e.preventDefault()

    this.props.pushState('/')
  }

  render () {
    const {authFail, login, register, forgot, changePassword, verified, params, config} = this.props
    const {currentView} = this.state

    const appConfig = this.props.config || {}

    return (
      <div className={cx('Auth', 'container')}>
        <div>
          <div className={cx('header')}>
            <h1 className={cx('title')}>{appConfig.title}</h1>
          </div>
          <div className={cx('window')}>
            {verified &&
            <Alert bsStyle='success'>
              Your email has been verified!
            </Alert>}

            {currentView === 'login' &&
            <LoginForm login={login} fail={authFail} />}
            {currentView === 'register' &&
            <RegisterForm register={register} fail={authFail} params={params} />}
            {currentView === 'forgot-password' &&
            <ForgotPasswordForm submitAction={forgot} fail={authFail} />}
            {currentView === 'change-password' &&
            <ChangePasswordForm submitAction={changePassword} username={params.username} code={params.passwordChangeCode} fail={authFail} />}
          </div>
          {currentView === 'login' && config.githubAuth &&
          <div className={cx('oauthBox', 'clearfix')}>
            <div className='pull-right'>
              <a href='/api/auth/github' className='btn btn-default'>Github</a>
            </div>
            <div className='pull-right'>Or login using</div>
          </div>}
          {currentView === 'login' &&
          <div className={cx('switchBox')}>
            <span className={cx('label')}>Don't have an account?</span>
            <Link to='/register' data-toggle='tab' role='tab' aria-expanded='true' className={cx('btnSwitch', 'btn', 'btn-default')}>Sign Up</Link>
          </div>}
          {currentView === 'register' &&
          <div className={cx('switchBox')}>
            <span className={cx('label')}>Already have an account?</span>
            <Link to='/login' data-toggle='tab' role='tab' aria-expanded='true' className={cx('btnSwitch', 'btn', 'btn-default')}>Login</Link>
          </div>}
        </div>

        {(currentView === 'forgot-password' || currentView === 'change-password') &&
        <a href='' onClick={this.goBack} className={cx('closeButton')}>✕</a>}
      </div>
    )
  }
}
