import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import Helmet from 'react-helmet'
import LoadingBar from 'react-redux-loading-bar'

import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import Label from 'react-bootstrap/lib/Label'

import hotkeys from 'decorators/hotkeys'

import { isLoaded as isAuthLoaded, load as loadAuth, loadConfig, logout, updateBalance, verify } from 'redux/actions/auth'
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
    advancedMode: state.auth.advancedMode
  }),
  {logout, pushState: routeActions.push, historyAddPayment, updateBalance, verify, loadConfig})
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

    verify: PropTypes.func,
    loadConfig: PropTypes.func
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

  render() {
    const { user, advancedMode } = this.props
    const appConfig = this.props.config || {}

    return (
      <div className={cx('container')}>
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

        {__CLIENT__ &&
        <LoadingBar className={cx('loadingBar')} />}

        {/* <script src="https://web-payments.net/polyfill.js"></script> */}

        {user &&
        <Navbar fixedTop expanded={ this.state.navExpanded } onToggle={ this.onNavbarToggle }>
          <Navbar.Header>
            <Navbar.Brand>
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
              {!user.github_id &&
              <LinkContainer to="/settings">
                <NavItem onClick={this.onNavItemClick}>Settings</NavItem>
              </LinkContainer>}
              <NavItem href="https://interledgerjs.github.io/ilp-kit/apidoc/"
                             target="_blank" onClick={this.onNavItemClick}>
                API docs
              </NavItem>
              <LinkContainer to="/logout">
                <NavItem className="logout-link" onClick={this.handleLogout}>
                  Logout
                </NavItem>
              </LinkContainer>
            </Nav>
            <Navbar.Text pullRight>
              {user.profile_picture &&
              <img className={cx('profilePic')} src={user.profile_picture} />}
              Hi {user.displayName}
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>}

        <div className={cx('appContent')}>
          {this.props.children}
        </div>

        {advancedMode && <div className={cx('version')}>Version: {config.version}</div>}
      </div>
    )
  }
}
