import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import * as authActions from 'redux/actions/auth'
import { push } from 'react-router-redux'

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
  {...authActions, pushState: push})
export default class Home extends Component {
  static propTypes = {
    authFail: PropTypes.object,
    login: PropTypes.func,
    register: PropTypes.func,
    forgot: PropTypes.func,
    config: PropTypes.object,
    pushState: PropTypes.func.isRequired,

    // User verification
    match: PropTypes.object,
    verified: PropTypes.bool,

    // Password change
    changePassword: PropTypes.func
  }

  componentWillMount () {
    this.setCurrentView()
  }

  componentDidMount () {
    document.getElementsByTagName('body')[0].className = 'guest'
  }

  componentWillReceiveProps (nextProps) {
    this.setCurrentView(nextProps)
  }

  componentWillUnmount () {
    document.getElementsByTagName('body')[0].className = ''
  }

  setCurrentView (props) {
    const prps = props || this.props
    const fullPath = prps.match.url
    let currentView = fullPath && fullPath.match(/\/([a-zA-Z-]*)/i)[1]

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
    const {authFail, login, register, forgot, changePassword, verified, match: { params }, config} = this.props
    const {currentView} = this.state

    const appConfig = this.props.config || {}

    return (
      <div className={cx('Auth')}>
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
          <div>
            <a href='/api/auth/github' className={cx('btn', 'btn-lg', 'btn-block', 'alternateAction')}>
              <i className={cx('fa', 'fa-github', 'icon')} /> Github Login
            </a>
          </div>}

          <div>
            {(currentView === 'register' || currentView === 'forgot-password') &&
            <Link to='/login' data-toggle='tab' role='tab' aria-expanded='true'
                  className={cx('btn', 'btn-lg', 'btn-block', 'alternateAction')}>
              <i className={cx('fa', 'fa-sign-in', 'icon')} /> Login
            </Link>}
            {(currentView === 'login' || currentView === 'forgot-password') &&
            <Link to='/register' data-toggle='tab' role='tab' aria-expanded='true'
                  className={cx('btn', 'btn-lg', 'btn-block', 'alternateAction')}>
              <i className={cx('fa', 'fa-user-plus', 'icon')} /> Create Account
            </Link>}
          </div>
        </div>

        {(currentView === 'forgot-password' || currentView === 'change-password') &&
        <a href='' onClick={this.goBack} className={cx('closeButton')}>✕</a>}
      </div>
    )
  }
}
