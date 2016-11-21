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
    verified: state.auth.verified
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
    const {authFail, login, register, forgot, changePassword, verified, params} = this.props
    const {currentView} = this.state

    return (
      <div className="row">
        <div className="col-xs-12 col-sm-offset-4 col-sm-4">
          <div className={cx('panel', 'panel-transparent', 'panel-auth')}>
            <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="collapse">
              <li className={currentView === 'login' ? 'active' : ''}>
                <Link to="/login" data-toggle="tab" role="tab" aria-expanded="true">Login</Link>
              </li>
              {config.registration &&
              <li className={currentView === 'register' ? 'active' : ''}>
                <Link to="/register" data-toggle="tab" role="tab" aria-expanded="true">Register</Link>
              </li>}
            </ul>
            <div className="tab-content">
              <div className="tab-pane active">
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
            </div>
            {config.githubAuth &&
            <div className={cx('oauthContainer', 'clearfix')}>
              <div className="pull-left">Or login using</div>
              <div className="pull-right">
                <a href="/api/auth/github" className="btn btn-primary">Github</a>
              </div>
            </div>}
          </div>
        </div>
      </div>
    )
  }
}
