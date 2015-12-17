import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { IndexLink } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { NavItem } from 'react-bootstrap';
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
      this.props.pushState(null, '/');
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
      <div className={styles.container + ' container'}>
        <script src="https://web-payments.net/polyfill.js"></script>
        <DocumentMeta {...config.app}/>
        <div className={styles.header + ' clearfix'}>
          <nav>
            <ul className="nav nav-pills pull-right">
              {user &&
              <li role="presentation" className={styles.navText}>
                Hi <strong>{user.name}</strong>.
              </li>}
              <li role="presentation">
                <IndexLink to="/">
                  <span>Home</span>
                </IndexLink>
              </li>
              {!user &&
              <LinkContainer to="/login">
                <NavItem>Login</NavItem>
              </LinkContainer>}
              {!user &&
              <LinkContainer to="/register">
                <NavItem>Register</NavItem>
              </LinkContainer>}
              {user &&
              <LinkContainer to="/logout">
                <NavItem className="logout-link" onClick={this.handleLogout}>
                  Logout
                </NavItem>
              </LinkContainer>}
            </ul>
          </nav>
          <h3 className="text-muted">
            <p>{config.app.title}</p>
          </h3>
        </div>

        <div className={styles.appContent}>
          {this.props.children}
        </div>

        <footer className={styles.footer}>
          <p>&copy; 2015 <a href="http://interledger.org/">Interledger</a>.</p>
        </footer>
      </div>
    );
  }
}
