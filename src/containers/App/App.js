import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import Waypoint from 'react-waypoint'
import NavItem from 'react-bootstrap/lib/NavItem'
import DocumentMeta from 'react-document-meta'
import { isLoaded as isAuthLoaded, load as loadAuth, loadConfig, logout, updateBalance } from 'redux/actions/auth'
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
    config: state.auth.config
  }),
  {logout, pushState: routeActions.push, historyAddPayment, updateBalance})
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    config: PropTypes.object,
    logout: PropTypes.func.isRequired,
    historyAddPayment: PropTypes.func.isRequired,
    updateBalance: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
  }

  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  static childContextTypes = {
    config: PropTypes.object
  }

  getChildContext() {
    return {
      config: this.props.config
    }
  }

  componentDidMount() {
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

  handleLogout = (event) => {
    event.preventDefault()
    // TODO don't disconnect, just unsubscribe
    socket.disconnect()
    this.props.logout()
  }

  _handleWaypointEnter = () => {
    if (this.navBar === 'navbar-default') {
      this.navBar = ''
      this.forceUpdate()
    }
  }

  _handleWaypointLeave = () => {
    if (!this.navBar) {
      this.navBar = 'navbar-default'
      this.forceUpdate()
    }
  }

  render() {
    const {user} = this.props

    return (
      <div>
        <div className={cx('container')}>
          <script src="https://web-payments.net/polyfill.js"></script>
          <DocumentMeta {...config.app}/>
          <div className={cx('waypoint')}>
            <Waypoint onEnter={this._handleWaypointEnter} onLeave={this._handleWaypointLeave} />
          </div>
          {user &&
            <nav className={cx('navbar', 'navbar-fixed-top', this.navBar)}>
              <div className="container">
                <div className="navbar-header">
                  <span className="navbar-brand">{config.app.title}</span>
                </div>
                <div className="collapse navbar-collapse">
                  <ul className="nav navbar-nav pull-right">
                    <li>
                      <p className="navbar-text">
                        {user.profile_picture &&
                        <img className={cx('profilePic')} src={user.profile_picture} />}
                        Hi {user.username}
                      </p>
                    </li>
                    <IndexLinkContainer to="/">
                      <NavItem>Home</NavItem>
                    </IndexLinkContainer>
                    <LinkContainer to="/button">
                      <NavItem>Pay Button</NavItem>
                    </LinkContainer>
                    <li>
                      <a href="https://interledger.org/five-bells-wallet/docs" target="_blank">
                        API docs
                      </a>
                    </li>
                    {!user.github_id &&
                    <LinkContainer to="/settings">
                      <NavItem>Settings</NavItem>
                    </LinkContainer>}
                    <LinkContainer to="/logout">
                      <NavItem className="logout-link" onClick={this.handleLogout}>
                        Logout
                      </NavItem>
                    </LinkContainer>
                  </ul>
                </div>
              </div>
            </nav>}

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
      </div>
    )
  }
}
