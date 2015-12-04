import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import DocumentMeta from 'react-document-meta';
import * as authActions from 'redux/modules/auth';
import config from '../../config';

@connect(
  state => ({user: state.auth.user}),
  authActions)
export default class Register extends Component {
  static propTypes = {
    user: PropTypes.object,
    register: PropTypes.func,
    logout: PropTypes.func
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const nameInput = this.refs.name;
    const passwordInput = this.refs.password;
    this.props.register(nameInput.value, passwordInput.value);
  }

  render() {
    // const {user, logout} = this.props;
    const styles = require('./Register.scss');
    return (
      <div className={styles.registerPage + ' container'}>
        <DocumentMeta title={config.app.title + ': Register'}/>
        <h1>Register</h1>
          <form className="register-form" onSubmit={this.handleSubmit}>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" ref="name" placeholder="Enter a name" className="form-control"/>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group">
                  <label>Password</label>
                  <input type="text" ref="password" placeholder="Enter a password" className="form-control"/>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-success"><i className="fa fa-sign-in"/>{' '}Register</button>
          </form>
      </div>
    );
  }
}
