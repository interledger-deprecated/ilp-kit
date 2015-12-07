import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as authActions from 'redux/modules/auth';
import config from '../../config';

@connect(
  state => ({user: state.auth.user}),
  authActions)
export default class Login extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    logout: PropTypes.func
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const nameInput = this.refs.name;
    const passwordInput = this.refs.password;
    this.props.login(nameInput.value, passwordInput.value);
  }

  render() {
    // const {user, logout} = this.props;
    const styles = require('./Login.scss');
    return (
      <div className={styles.loginPage + ' container'}>
        <DocumentMeta title={config.app.title + ': Login'}/>
        <h1>Login</h1>
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-sm-4">
              <div className="form-group">
                <label>Name</label>
                <input type="text" ref="name" className="form-control"/>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-4">
              <div className="form-group">
                <label>Password</label>
                <input type="text" ref="password" className="form-control"/>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-success"><i className="fa fa-sign-in"/>{' '}Log In</button>
        </form>
      </div>
    );
  }
}
