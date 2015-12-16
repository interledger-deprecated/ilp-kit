import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import registerValidation from './RegisterValidation';

import {Alert} from 'react-bootstrap';

import styles from './RegisterForm.scss';

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
    const { handleSubmit, register, success, fail, type, fields: {name, password}, pristine, invalid, submitting } = this.props;

    return (
      <form onSubmit={handleSubmit(register)} className={styles[type]}>
        {success &&
        <Alert bsStyle="success">
          <strong>Holy guacamole!</strong> You've just sent some money!
        </Alert>}

        {fail && fail.status === 403 &&
        <Alert bsStyle="danger">
          <strong>Woops!</strong> Invalid username/password
        </Alert>}

        <div className={styles.fields}>
          <div className="form-group">
            <label className={styles.label}>Name</label>
            <input type="text" placeholder="Enter a name" className="form-control" {...name} />
            {name.error && name.touched && <div className="text-danger">{name.error}</div>}
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
