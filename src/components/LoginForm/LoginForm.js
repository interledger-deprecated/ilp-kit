import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import loginValidation from './LoginValidation'

import Alert from 'react-bootstrap/lib/Alert'

import { Input } from 'components'

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
    fail: PropTypes.object
  }

  componentWillUnmount() {
    this.props.unmount()
  }

  render() {
    const { handleSubmit, login, fail, fields: {username, password}, pristine, invalid, submitting } = this.props

    return (
      <form onSubmit={handleSubmit(login)}>
        {fail && fail.id === 'UnauthorizedError' &&
        <Alert bsStyle="danger">
          <strong>Woops!</strong> Invalid username/password
        </Alert>}

        <div>
          {/* TODO:UX autofill the username after email verification */}
          <Input object={username} label="Username or Email" size="lg" focus />
          <Input object={password} label="Password" size="lg" type="password" />
        </div>
        <button type="submit" className="btn btn-complete" disabled={pristine || invalid || submitting}>
          <i className="fa fa-sign-in"/>
          {submitting ? ' Logging In...' : ' Login'}
        </button>
      </form>
    )
  }
}
