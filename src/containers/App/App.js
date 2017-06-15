import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import { Link } from 'react-router'
import Helmet from 'react-helmet'
import LoadingBar from 'react-redux-loading-bar'

import ReactFitText from 'react-fittext'
import Alert from 'react-bootstrap/lib/Alert'

import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import NavDropdown from 'react-bootstrap/lib/NavDropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import Label from 'react-bootstrap/lib/Label'

import Amount from 'components/Amount/Amount'

import hotkeys from 'decorators/hotkeys'

import { isLoaded as isAuthLoaded, load as loadAuth, loadConfig, logout, updateBalance, verify, resendVerificationEmail } from 'redux/actions/auth'
import { routeActions } from 'react-router-redux'
import { addActivity } from 'redux/actions/activity'
import { asyncConnect } from 'redux-connect'

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
  {logout, pushState: routeActions.push, addActivity, updateBalance, verify, loadConfig, resendVerificationEmail})
@hotkeys()
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    config: PropTypes.object,
    logout: PropTypes.func.isRequired,
    addActivity: PropTypes.func.isRequired,
    updateBalance: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired,
    params: PropTypes.object,
    // TODO:UI add loading screen
    advancedMode: PropTypes.bool,
    loadConfig: PropTypes.func,

    // User verification
    verified: PropTypes.bool,
    verify: PropTypes.func,
    verificationEmailSent: PropTypes.bool,
    resendVerificationEmail: PropTypes.func
  }

  static contextTypes = {
    store: PropTypes.object.isRequired,
    router: PropTypes.object
  }

  state = {
    navExpanded: false
  }

  componentWillMount () {
    if (!this.props.config.ledgerUri) {
      this.props.loadConfig()
    }
  }

  componentDidMount () {
    const params = this.props.params

    this.connect()

    if (params.username) {
      // Email verification
      if (params.verifyCode) {
        this.props.verify(params.username, params.verifyCode)
      }
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.user && nextProps.user) {
      // login or register
      this.props.pushState('/')
      this.connect(nextProps)
    } else if (this.props.user && !nextProps.user) {
      // logout
      this.props.pushState('/')
    }
  }

  connect = (props = this.props) => {
    if (!props.user || !props.user.username) return

    if (socket) {
      socket.connect()

      socket.on('activity', props.addActivity)
      socket.on('balance', props.updateBalance)
      socket.on('reconnect', () => socket.emit('subscribe', props.user.username))

      socket.emit('subscribe', props.user.username)
    }
  }

  onNavItemClick = () => {
    this.setState({ navExpanded: false })
  }

  onNavbarToggle = () => {
    this.setState({ navExpanded: !this.state.navExpanded })
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

  render () {
    const { user, config = {}, advancedMode, verified, verificationEmailSent } = this.props

    return (
      <div className={cx('App', !user && 'darkBg')}>
        <Helmet defaultTitle={config.title} titleTemplate={config.title && '%s - ' + config.title}>
          <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' />
          <meta property='og:type' content='website' />
          <meta property='og:title' content={config.title} />
          <meta name='twitter:title' content={config.title} />
          <meta name='twitter:card' content='summary' />
          <meta itemProp='name' content={config.title} />
        </Helmet>

        <LoadingBar className={cx('loadingBar')} />

        {user &&
        <Navbar inverse expanded={this.state.navExpanded} onToggle={this.onNavbarToggle}>
          <Navbar.Header>
            <Navbar.Brand className={cx('brand')}>
              {config.title} {advancedMode && <Label bsStyle='warning'>Advanced Mode</Label>}
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              <IndexLinkContainer to='/'>
                <NavItem onClick={this.onNavItemClick}>Home</NavItem>
              </IndexLinkContainer>
              {user.isAdmin &&
              <LinkContainer to='/users'>
                <NavItem onClick={this.onNavItemClick}>Users</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to='/withdrawals'>
                <NavItem onClick={this.onNavItemClick}>Withdrawals</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to='/invites'>
                <NavItem onClick={this.onNavItemClick}>Invites</NavItem>
              </LinkContainer>}
              {user.isAdmin &&
              <LinkContainer to='/peers'>
                <NavItem onClick={this.onNavItemClick}>Peers</NavItem>
              </LinkContainer>}

              {user.isAdmin &&
              <NavDropdown id='settlementDropdown' title='Settlements'>
                <LinkContainer to='/settlements/user'>
                  <MenuItem>User Settlements</MenuItem>
                </LinkContainer>
                <LinkContainer to='/settlements/peer'>
                  <MenuItem>Peer Settlements</MenuItem>
                </LinkContainer>
                <LinkContainer to='/settlements/settings'>
                  <MenuItem>Configure</MenuItem>
                </LinkContainer>
              </NavDropdown>}

              <NavDropdown id='navDropdown' title={<span>{user.profile_picture && <img className={cx('profilePic')} src={user.profile_picture} />} {user.displayName}</span>}>
                {!user.github_id &&
                <LinkContainer to='/settings'>
                  <MenuItem>Settings</MenuItem>
                </LinkContainer>}
                <MenuItem href='https://interledgerjs.github.io/ilp-kit/apidoc/' target='_blank'>API Docs</MenuItem>
                <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>}

        {user && user.email && (!user.email_verified || verified) &&
        <Alert bsStyle={verified ? 'success' : 'info'} className={cx('topNotificationBox')}>
          <div className={cx('container')}>
            {verified && <span>Your email has been verified!</span>}
            {!verified &&
            <span>
              An email has been sent to <strong>{user.email}</strong>.
              Please follow the steps in the message to confirm your email address.&nbsp;
              {!verificationEmailSent && <a href='' onClick={this.resendVerification}>Resend the message</a>}
              {verificationEmailSent && <strong>Verification email sent!</strong>}
            </span>}
          </div>
        </Alert>}

        {user && user.isAdmin && config.versions && config.versions.current !== config.versions.latest &&
        <Alert bsStyle={'info'} className={cx('topNotificationBox')}>
          <div className={cx('container')}>
            Your ILP Kit (v. {config.versions.current}) is outdated. Please upgrade to the <a href='https://github.com/interledgerjs/ilp-kit/tree/release' target='_blank'>latest version</a> (v. {config.versions.latest}).
          </div>
        </Alert>}

        {user && user.balance !== undefined &&
        <div className={cx('mobileHeader')}>
          <ReactFitText compressor={0.8}>
            <div className={cx('balanceContainer')}>
              <Amount amount={user.balance} currencySymbol={config.currencySymbol} />
            </div>
          </ReactFitText>
        </div>}

        <div className={cx('container')}>
          {this.props.children}
        </div>

        {user &&
        <div className={cx('mobileFooter')}>
          <Link to='/' className={cx('activity')}>Activity</Link>
          <Link to='/send' className={cx('send')}>Send</Link>
          <Link to='/settings' className={cx('settings')}>
            <i className={cx('fa', 'fa-gear')} />
          </Link>
          <Link to='/' onClick={this.handleLogout} className={cx('logout')}>
            <i className={cx('fa', 'fa-sign-out')} />
          </Link>
        </div>}

        {advancedMode && <div className={cx('version')}>Version: {config.versions && (config.versions.current + '-' + config.versions.hash)}</div>}
      </div>
    )
  }
}
