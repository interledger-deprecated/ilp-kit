import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import registerValidation from './RegisterValidation';

import {Alert} from 'react-bootstrap';

import styles from './RegisterForm.scss';

// TODO async validation on username
@reduxForm({
  form: 'register',
  fields: ['name', 'password'],
  validate: registerValidation
})

export default class RegisterForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    register: PropTypes.func.isRequired,
    success: PropTypes.bool,
    fail: PropTypes.object,
    type: PropTypes.string
  };

  render() {
    const { handleSubmit, register, success, fail, type, fields: {username, password}, pristine, invalid, submitting } = this.props;

    return (
      <form onSubmit={handleSubmit(register)} className={styles[type]}>
        {success &&
        <Alert bsStyle="success">
          <strong>Holy guacamole!</strong> You've just sent some money!
        </Alert>}

        {fail &&
        <Alert bsStyle="danger">
          {fail.status === 400 &&
          <div><strong>Woops!</strong> Input data is invalid</div>}
          {fail.status === 409 &&
          <div><strong>Woops!</strong> Username is already taken</div>}
        </Alert>}

        <div className={styles.fields}>
          <div className="form-group">
            <label className={styles.label}>Username</label>
            <input type="text" placeholder="Enter a username" className="form-control" {...username} />
            {username.error && username.touched && <div className="text-danger">{username.error}</div>}
          </div>
          <div className="form-group">
            <label className={styles.label}>Password</label>
            <input type="password" placeholder="Enter a password" className="form-control" {...password} />
            {password.error && password.touched && <div className="text-danger">{password.error}</div>}
          </div>
        </div>
        <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
          <i className="fa fa-sign-in"/>
          {submitting ? ' Registering...' : ' Register'}
        </button>
      </form>
    );
  }
}
