import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import loginValidation from './LoginValidation';

import {Alert} from 'react-bootstrap';

import classNames from 'classnames/bind';
import inputStyles from '../../containers/App/Inputs.scss';
import styles from './LoginForm.scss';
const cx = classNames.bind({...inputStyles, ...styles});

@reduxForm({
  form: 'login',
  fields: ['username', 'password'],
  validate: loginValidation
})

export default class LoginForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    unmount: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.object,
    type: PropTypes.string
  };

  componentWillUnmount() {
    this.props.unmount();
  }

  render() {
    const { handleSubmit, login, success, fail, type, fields: {username, password}, pristine, invalid, submitting } = this.props;

    return (
      <form onSubmit={handleSubmit(login)} className={styles[type]}>
        {success &&
        <Alert bsStyle="success">
          <strong>Holy guacamole!</strong> You've just sent some money!
        </Alert>}

        {fail && fail.id === 'UnauthorizedError' &&
        <Alert bsStyle="danger">
          <strong>Woops!</strong> Invalid username/password
        </Alert>}

        <div className={cx('fields')}>
          <div className="form-group">
            <label className={cx('label')}>Username</label>
            <input type="text" placeholder="Username" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} autoFocus {...username} />
            {username.dirty && username.error && <div className="text-danger">{username.error}</div>}
          </div>
          <div className="form-group">
            <label className={cx('label')}>Password</label>
            <input type="password" placeholder="Password" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} {...password} />
            {password.dirty && password.error && <div className="text-danger">{password.error}</div>}
          </div>
        </div>
        <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
          <i className="fa fa-sign-in"/>
          {submitting ? ' Logging In...' : ' Login'}
        </button>
      </form>
    );
  }
}
