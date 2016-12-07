import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {reduxForm} from 'redux-form'
import loginValidation from './LoginValidation'

import Alert from 'react-bootstrap/lib/Alert'

import { successable } from 'decorators'

import Input from 'components/Input/Input'

import classNames from 'classnames/bind';
import styles from './LoginForm.scss';
const cx = classNames.bind(styles);

@reduxForm({
  form: 'login',
  fields: ['username', 'password'],
  validate: loginValidation
})
@successable()
export default class LoginForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,

    // Successable
    permSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    fail: PropTypes.any
  }

  login = (data) => {
    return this.props.login(data)
      .then(this.props.permSuccess)
      .catch(this.props.permFail)
  }

  render() {
    const { handleSubmit, fail, fields: {username, password}, pristine, invalid, submitting } = this.props

    return (
      <form onSubmit={handleSubmit(this.login)}>
        {fail && fail.id === 'UnauthorizedError' &&
        <Alert bsStyle="danger">
          Invalid username/password
        </Alert>}

        <div>
          {/* TODO:UX autofill the username after email verification */}
          <Input object={username} label="Username or Email" size="lg" focus autoCapitalize="off" />
          <Input object={password} label="Password" size="lg" type="password" />
        </div>
        <div className="row">
          <div className="col-sm-4">
            <button type="submit" className="btn btn-complete" disabled={pristine || invalid || submitting}>
              {submitting ? ' Logging In...' : ' Login'}
            </button>
          </div>
          <div className={cx('col-sm-8', 'text-right', 'forgotPasswordLinkContainer')}>
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>
        </div>
      </form>
    )
  }
}
