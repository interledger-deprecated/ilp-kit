import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap';
import NavItem from 'react-bootstrap/lib/NavItem';
import DocumentMeta from 'react-document-meta';
import { isLoaded as isAuthLoaded, load as loadAuth, logout } from 'redux/modules/auth';
import { pushState } from 'redux-router';
import connectData from 'helpers/connectData';
import config from '../../config';

import classNames from 'classnames/bind';
import styles from './App.scss';
const cx = classNames.bind(styles);

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

  handleLogout = (event) => {
    event.preventDefault();
    this.props.logout();
  }

  render() {
    const {user} = this.props;

    return (
      <div className={cx('container')}>
        <script src="https://web-payments.net/polyfill.js"></script>
        <DocumentMeta {...config.app}/>
        <div className={cx('header', 'clearfix')}>
          <nav className={cx('headerContainer', 'container')}>
            <ul className="nav nav-pills pull-right">
              {user &&
              <li role="presentation" className={cx('navText')}>
                Hi <strong>{user.username}</strong>.
              </li>}
              {user &&
              <IndexLinkContainer to="/">
                <NavItem>Home</NavItem>
              </IndexLinkContainer>
              }
              {user &&
              <LinkContainer to="/button">
                <NavItem>Pay Button</NavItem>
              </LinkContainer>}
              {user &&
              <LinkContainer to="/logout">
                <NavItem className="logout-link" onClick={this.handleLogout}>
                  Logout
                </NavItem>
              </LinkContainer>}
            </ul>

            <h3 className={cx('logo')}>
              {config.app.title}
            </h3>
          </nav>
        </div>

        <div className={cx('appContent')}>
          {this.props.children}
        </div>

        <footer className={cx('footer')}>
          <div className="container">
            <p>&copy; 2016 <a href="http://interledger.org/">Interledger</a>.</p>
          </div>
        </footer>
      </div>
    );
  }
}
