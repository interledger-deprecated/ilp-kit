import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import Waypoint from 'react-waypoint'

import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import NavDropdown from 'react-bootstrap/lib/NavDropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'

import { isLoaded as isAuthLoaded, load as loadAuth, loadConfig, logout, updateBalance, verify } from 'redux/actions/auth'
import { routeActions } from 'react-router-redux'
import { addPayment as historyAddPayment } from 'redux/actions/history'
import config from '../../config'
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

    // Server config
    if (!getState().auth.config.ledgerUri) {
      promises.push(dispatch(loadConfig()))
    }

    return Promise.all(promises)
  }
}])
@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    loading: state.auth.loading
  }),
  {logout, pushState: routeActions.push, historyAddPayment, updateBalance, verify})
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

    verify: PropTypes.func
  }

  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  static childContextTypes = {
    config: PropTypes.object
  }

  state = {
    navExpanded: false
  }

  getChildContext() {
    return {
      config: this.props.config
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

  _handleWaypointEnter = () => {
    if (this.navBar === 'navbar-active') {
      this.navBar = ''
      this.forceUpdate()
    }
  }

  _handleWaypointLeave = () => {
    if (!this.navBar) {
      this.navBar = 'navbar-active'
      this.forceUpdate()
    }
  }

  render() {
    const { user } = this.props
    const appConfig = this.props.config

    const meta = {
      ...config.app,
      title: appConfig.title
    }

    return (
      <div className={cx('container')}>
        {/* <script src="https://web-payments.net/polyfill.js"></script> */}

        <div className={cx('waypoint')}>
          <Waypoint onEnter={this._handleWaypointEnter} onLeave={this._handleWaypointLeave} />
        </div>

        {user &&
        <Navbar fixedTop className={this.navBar} expanded={ this.state.navExpanded } onToggle={ this.onNavbarToggle }>
          <Navbar.Header>
            <Navbar.Brand>
              {appConfig.title}
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              <IndexLinkContainer to="/">
                <NavItem onClick={this.onNavItemClick}>Home</NavItem>
              </IndexLinkContainer>
              {user.isAdmin &&
              <LinkContainer to="/invites">
                <NavItem onClick={this.onNavItemClick}>Invites</NavItem>
              </LinkContainer>}
              {!user.github_id &&
              <LinkContainer to="/settings">
                <NavItem onClick={this.onNavItemClick}>Settings</NavItem>
              </LinkContainer>}
              <NavDropdown title="Dev Tools" id="devtools">
                <MenuItem href="https://interledger.org/ilp-kit/apidoc"
                          target="_blank" onClick={this.onNavItemClick}>
                  API docs
                </MenuItem>
                <MenuItem href="https://github.com/interledgerjs/ilp-kit-client"
                          target="_blank" onClick={this.onNavItemClick}>
                  ILP Kit Client
                </MenuItem>
              </NavDropdown>
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

        {user &&
          <div className="footer">
            <div className="copyright">
              <span className="hint-text">© 2016 </span>
              <a href="https://interledger.org">
                 Interledger
              </a>.
            </div>
          </div>}
      </div>
    )
  }
}
