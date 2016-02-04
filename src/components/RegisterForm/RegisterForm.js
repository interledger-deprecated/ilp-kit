import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import registerValidation from './RegisterValidation';

import Alert from 'react-bootstrap/lib/Alert';

import classNames from 'classnames/bind';
import inputStyles from '../../containers/App/Inputs.scss';
import styles from './RegisterForm.scss';
const cx = classNames.bind({...inputStyles, ...styles});

// TODO async validation on username
@reduxForm({
  form: 'register',
  fields: ['username', 'password'],
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
    unmount: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.object,
    type: PropTypes.string
  };

  componentWillUnmount() {
    this.props.unmount();
  }

  render() {
    const { handleSubmit, register, success, fail, type, fields: {username, password}, pristine, invalid, submitting } = this.props;

    return (
      <form onSubmit={handleSubmit(register)} className={styles[type]}>
        {success &&
        <Alert bsStyle="success">
          <strong>Holy guacamole!</strong> You've just sent some money!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle="danger">
          {fail.id === 'UsernameTakenError' &&
          <div><strong>Woops!</strong> Username is already taken</div>}
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
        <button type="submit" className={cx('btn', 'lu-btn')} disabled={pristine || invalid || submitting}>
          <i className="fa fa-sign-in"/>
          {submitting ? ' Registering...' : ' Register'}
        </button>
      </form>
    );
  }
}
