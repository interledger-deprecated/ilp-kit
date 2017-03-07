import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import Helmet from 'react-helmet'
import LoadingBar from 'react-redux-loading-bar'

import Alert from 'react-bootstrap/lib/Alert'

import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import NavDropdown from 'react-bootstrap/lib/NavDropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import Label from 'react-bootstrap/lib/Label'

import hotkeys from 'decorators/hotkeys'

import { isLoaded as isAuthLoaded, load as loadAuth, loadConfig, logout, updateBalance, verify, resendVerificationEmail } from 'redux/actions/auth'
import { routeActions } from 'react-router-redux'
import { addPayment as historyAddPayment } from 'redux/actions/history'
import { asyncConnect } from 'redux-async-connect'

import classNames from 'classnames/bind'
import styles from './App.scss'
const cx = classNames.bind(styles)

@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    const promises = []

    if (!isAuthLoaded(getState())) {
      promises.push(dispatch(loadAuth()))
    }

    return Promise.all(promises)
  }
}])
@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    loading: state.auth.loading,
    advancedMode: state.auth.advancedMode,
    verificationEmailSent: state.auth.verificationEmailSent
  }),
  {logout, pushState: routeActions.push, historyAddPayment, updateBalance, verify, loadConfig, resendVerificationEmail})
@hotkeys()
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    config: PropTypes.object,
    logout: PropTypes.func.isRequired,
    historyAddPayment: PropTypes.func.isRequired,
    updateBalance: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired,
    params: PropTypes.object,
    store: PropTypes.object,
    // TODO:UI add loading screen
    loading: PropTypes.bool,
    advancedMode: PropTypes.bool,
    loadConfig: PropTypes.func,

    // User verification
    verified: PropTypes.bool,
    verify: PropTypes.func,
    verificationEmailSent: PropTypes.bool,
    resendVerificationEmail: PropTypes.func
  }

  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  state = {
    navExpanded: false
  }

  componentWillMount() {
    if (!this.props.config.ledgerUri) {
      this.props.loadConfig()
    }
  }

  componentDidMount() {
    const params = this.props.params

    // TODO socket stuff needs work
    if (socket) {
      socket.connect()
      socket.on('payment', (payment) => {
        this.props.historyAddPayment(payment)
      })
      socket.on('balance', (balance) => {
        this.props.updateBalance(balance)
      })

      if (this.props.user && this.props.user.username) {
        socket.emit('subscribe', this.props.user.username)
      }
    }

    if (params.username) {
      // Email verification
      if (params.verifyCode) {
        this.props.verify(params.username, params.verifyCode)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.user && nextProps.user) {
      // login
      this.props.pushState('/')
    } else if (this.props.user && !nextProps.user) {
      // logout
      this.props.pushState('/')
    }
  }

  onNavItemClick = () => {
    this.setState({ navExpanded: false })
  }

  onNavbarToggle = () => {
    this.setState({ navExpanded: ! this.state.navExpanded })
  }

  handleLogout = (event) => {
    event.preventDefault()
    // TODO don't disconnect, just unsubscribe
    socket.disconnect()
    this.props.logout()
  }

  resendVerification = (event) => {
    event.preventDefault()

    this.props.resendVerificationEmail(this.props.user.username)
  }

  render() {
    const { user, advancedMode, verified, verificationEmailSent } = this.props
    const appConfig = this.props.config || {}

    return (
      <div className={cx('App', !user && 'darkBg')}>
        <Helmet
          defaultTitle={appConfig.title}
          titleTemplate={appConfig.title && '%s - ' + appConfig.title}
          meta={[
            {'name': 'viewport', 'content': 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'},

            {'property': 'og:type', 'content': 'website'},
            {'property': 'og:title', 'content': appConfig.title},

            {'name': 'twitter:title', 'content': appConfig.title},
            {'name': 'twitter:card', 'content': 'summary'},

            {'itemprop': 'name', 'content': appConfig.title}
          ]}
        />

        {/* TODO commented out until there's a solution to https://github.com/mironov/react-redux-loading-bar/issues/30 */}
         <LoadingBar className={cx('loadingBar')} />

        {/* <script src="https://web-payments.net/polyfill.js"></script> */}

        {user &&
        <Navbar inverse expanded={ this.state.navExpanded } onToggle={ this.onNavbarToggle }>
          <Navbar.Header>
            <Navbar.Brand className={cx('brand')}>
              {appConfig.title} {advancedMode && <Label bsStyle="warning">Advanced Mode</Label>}
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              <IndexLinkContainer to="/">
                <NavItem onClick={this.onNavItemClick}>Home</NavItem>
              </IndexLinkContainer>
              {user.isAdmin &&
              <LinkContainer to="/users">
                <NavItem onClick={this.onNavItemClick}>Users</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to="/invites">
                <NavItem onClick={this.onNavItemClick}>Invites</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to="/peers">
                <NavItem onClick={this.onNavItemClick}>Peers</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to="/settlement">
                <NavItem onClick={this.onNavItemClick}>Settlement</NavItem>
              </LinkContainer>}

              <NavDropdown id="navDropdown" title={<span>{user.profile_picture && <img className={cx('profilePic')} src={user.profile_picture} />} {user.displayName}</span>}>
                {!user.github_id &&
                <LinkContainer to="/settings">
                  <MenuItem>Settings</MenuItem>
                </LinkContainer>}
                <MenuItem href="https://interledgerjs.github.io/ilp-kit/apidoc/" target="_blank">API Docs</MenuItem>
                <MenuItem divider />
                <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>}

        {user && user.email && (!user.email_verified || verified) &&
        <Alert bsStyle={verified ? 'success' : 'info'} className={cx('notVerifiedBox')}>
          <div className={cx('container')}>
            {verified && <span>Your email has been verified!</span>}
            {!verified &&
            <span>
              An email has been sent to <strong>{user.email}</strong>.
              Please follow the steps in the message to confirm your email address.&nbsp;
              {!verificationEmailSent && <a href="" onClick={this.resendVerification}>Resend the message</a>}
              {verificationEmailSent && <strong>Verification email sent!</strong>}
            </span>}
          </div>
        </Alert>}

        <div className={cx('container')}>
          {this.props.children}
        </div>

        {advancedMode && <div className={cx('version')}>Version: {config.version}</div>}
      </div>
    )
  }
}
