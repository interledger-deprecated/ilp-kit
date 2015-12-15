import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';

import {Alert} from 'react-bootstrap';

import styles from './LoginForm.scss';

@reduxForm({
  form: 'login',
  fields: ['name']
})

export default class LoginForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    success: PropTypes.bool,
    fail: PropTypes.string,
    type: PropTypes.string
  };

  render() {
    const { handleSubmit, login, success, fail, type, fields: {name} } = this.props;

    return (
      <form onSubmit={handleSubmit(login)} className={styles[type]}>
        {success &&
        <Alert bsStyle="success">
          <strong>Holy guacamole!</strong> You've just sent some money!
        </Alert>}

        {fail &&
        <Alert bsStyle="danger">
          <strong>Woops!</strong> {fail}
        </Alert>}

        <div className={styles.fields}>
          <div className="form-group">
            <label className={styles.label}>Name</label>
            <input type="text" placeholder="Name" className="form-control" {...name} />
          </div>
        </div>
        <button type="submit" className="btn btn-success"><i className="fa fa-sign-in"/>{' '}Log In</button>
      </form>
    );
  }
}
