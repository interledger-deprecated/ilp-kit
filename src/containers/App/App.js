import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { IndexLink } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, NavBrand, Nav, NavItem, CollapsibleNav } from 'react-bootstrap';
import DocumentMeta from 'react-document-meta';
import { isLoaded as isAuthLoaded, load as loadAuth, logout } from 'redux/modules/auth';
import { pushState } from 'redux-router';
import connectData from 'helpers/connectData';
import config from '../../config';

function fetchData(getState, dispatch) {
  const promises = [];
  if (!isAuthLoaded(getState())) {
    promises.push(dispatch(loadAuth()));
  }
  return Promise.all(promises);
}

@connectData(fetchData)
@connect(
  state => ({user: state.auth.user}),
  {logout, pushState})
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    logout: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
  };

  static contextTypes = {
    store: PropTypes.object.isRequired
  };

  componentWillReceiveProps(nextProps) {
    if (!this.props.user && nextProps.user) {
      // login
      this.props.pushState(null, '/loginSuccess');
    } else if (this.props.user && !nextProps.user) {
      // logout
      this.props.pushState(null, '/');
    }
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', 'http://' + config.host + ':' + config.port + '/widget');
  }

  handleLogout = (event) => {
    event.preventDefault();
    this.props.logout();
  }

  render() {
    const {user} = this.props;
    const styles = require('./App.scss');
    return (
      <div className={styles.app}>
        <script src="https://web-payments.net/polyfill.js"></script>
        <DocumentMeta {...config.app}/>
        <Navbar fixedTop toggleNavKey={0}>
          <NavBrand>
            <IndexLink to="/" activeStyle={{color: '#33e0ff'}}>
              <div className={styles.brand}/>
              <span>{config.app.title}</span>
            </IndexLink>
          </NavBrand>

          <CollapsibleNav eventKey={0}>
            {user &&
              <p className="navbar-text">Balance: {user.balance}</p>}
            <Nav navbar>
              {user &&
              <LinkContainer to="/send">
                <NavItem eventKey={3}>Send</NavItem>
              </LinkContainer>}
            </Nav>
            <Nav navbar right>
              <NavItem eventKey={1} target="_blank" title="View on Github" href="https://github.com/interledger/five-bells-ledger-ui">
                <i className="fa fa-github"/>
              </NavItem>
            </Nav>
            <Nav navbar right>
              {!user &&
              <LinkContainer to="/login">
                <NavItem eventKey={6}>Login</NavItem>
              </LinkContainer>}
              {!user &&
              <LinkContainer to="/register">
                <NavItem eventKey={7}>Register</NavItem>
              </LinkContainer>}
              {user &&
              <p className={styles.loggedInMessage + ' navbar-text'}>Logged in as <strong>{user.name}</strong>.</p>}
              {user &&
              <LinkContainer to="/logout">
                <NavItem eventKey={8} className="logout-link" onClick={this.handleLogout}>
                  Logout
                </NavItem>
              </LinkContainer>}
            </Nav>
          </CollapsibleNav>
        </Navbar>

        <div className={styles.appContent}>
          {this.props.children}
        </div>

        <div className="well text-center">
          <button className="btn btn-success" onClick={this.handleDefaultPayment}>Make me your favorite payment provider</button>
        </div>

        <div className="well text-center">
          <a href="https://github.com/interledger/five-bells-ledger-ui" target="_blank">Five Bells Ledger UI</a>
        </div>
      </div>
    );
  }
}
