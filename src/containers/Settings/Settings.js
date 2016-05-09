import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import Alert from 'react-bootstrap/lib/Alert'

import * as actions from 'redux/actions/auth'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import { Input } from 'components'

@reduxForm({
  form: 'settings',
  fields: ['password', 'verifyPassword']
  // TODO local validation
}, state => ({
  user: state.auth.user,
  fail: state.auth.fail
}), actions)
@successable()
@resetFormOnSuccess('settings')
export default class Settings extends Component {
  static propTypes = {
    // Redux Form
    fields: PropTypes.object,
    pristine: PropTypes.bool,
    invalid: PropTypes.bool,
    handleSubmit: PropTypes.func,
    submitting: PropTypes.bool,

    // Successable
    succeed: PropTypes.func,
    success: PropTypes.bool,

    fail: PropTypes.object,
    user: PropTypes.object,
    save: PropTypes.func
  }

  save = (data) => {
    this.props.save({username: this.props.user.username}, data)
      .then(() => {
        this.props.succeed()

        tracker.track('Password change', {status: 'success'})
      })
      .catch((error) => {
        tracker.track('Password change', {status: 'fail', error: error})
      })
  }

  render() {
    const { fields: { password, verifyPassword }, pristine, invalid,
      handleSubmit, submitting, success, fail } = this.props

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="panel-title">Change Password</div>
        </div>
        <div className="panel-body">
          <div className="row">
            <div className="col-sm-6">
              {success &&
              <Alert bsStyle="success">
                <strong>Holy guacamole!</strong> Password has been successfully changed!
              </Alert>}

              {fail && fail.id &&
              <Alert bsStyle="danger">
                <strong>Woops! </strong>
                {(() => {
                  switch (fail.id) {
                    case 'PasswordsDontMatch': return 'Passwords don\'t match'
                    default: return 'Something went wrong'
                  }
                })()}
              </Alert>}

              {/* TODO:SECURITY ask for the current password */}
              <form onSubmit={handleSubmit(this.save)}>
                <Input object={password} label="New Password" type="password" size="lg" focus />
                <Input object={verifyPassword} label="Verify New Password" type="password" size="lg"/>
                <button type="submit" className="btn btn-primary" disabled={pristine || invalid || submitting}>
                  {submitting ? ' Saving...' : ' Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
