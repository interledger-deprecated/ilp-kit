import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import Alert from 'react-bootstrap/lib/Alert'

import * as actions from 'redux/actions/auth'

import validation from './PasswordValidation'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import Input from 'components/Input/Input'

@reduxForm({
  form: 'passwordSettings',
  fields: ['password', 'verifyPassword'],
  validate: validation
  // TODO local validation
}, state => ({
  user: state.auth.user,
  fail: state.auth.fail
}), actions)
@successable()
@resetFormOnSuccess('passwordSettings')
export default class ChangePasswordForm extends Component {
  static propTypes = {
    // Redux Form
    fields: PropTypes.object,
    pristine: PropTypes.bool,
    invalid: PropTypes.bool,
    handleSubmit: PropTypes.func,
    submitting: PropTypes.bool,
    error: PropTypes.any,
    submitFailed: PropTypes.bool,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,

    // Auth
    user: PropTypes.object,
    save: PropTypes.func
  }

  save = (data) => {
    return this.props.save({username: this.props.user.username}, data)
      .then(() => {
        this.props.tempSuccess()

        tracker.track('Password change', {status: 'success'})
      })
      .catch((error) => {
        tracker.track('Password change', {status: 'fail', error: error})

        throw {_error: error}
      })
  }

  render() {
    const { fields: { password, verifyPassword }, pristine, invalid,
      handleSubmit, submitting, success, error, submitFailed } = this.props

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="panel-title">Change Password</div>
        </div>
        <div className="panel-body">
          {success &&
          <Alert bsStyle="success">
            Password has been successfully changed!
          </Alert>}

          {error && error.id &&
          <Alert bsStyle="danger">
            {(() => {
              switch (error.id) {
                case 'PasswordsDontMatchError': return 'Passwords don\'t match'
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          {/* TODO:SECURITY ask for the current password */}
          <form onSubmit={handleSubmit(this.save)}>
            <Input object={password} label="New Password" type="password" size="lg" />
            <Input object={verifyPassword} label="Verify New Password" type="password" size="lg"/>
            <button type="submit" className="btn btn-primary" disabled={pristine || (invalid && !submitFailed) || submitting}>
              {submitting ? ' Saving...' : ' Change Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }
}
