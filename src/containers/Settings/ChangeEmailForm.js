import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import Alert from 'react-bootstrap/lib/Alert'

import * as actions from 'redux/actions/auth'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import { Input } from 'components'

@reduxForm({
  form: 'emailSettings',
  fields: ['email']
  // TODO local validation
}, state => ({
  user: state.auth.user,
  fail: state.auth.fail,
  // TODO server side rendering for initialValues is messed up
  // https://github.com/erikras/redux-form/issues/896
  initialValues: {
    email: state.auth.user.email || undefined
  }
}), actions)
@successable()
@resetFormOnSuccess('emailSettings')
export default class ChangeEmailForm extends Component {
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

        tracker.track('Email change', {status: 'success'})
      })
      .catch((error) => {
        tracker.track('Email change', {status: 'fail', error: error})
      })
  }

  render() {
    const { fields: { email }, pristine, invalid,
      handleSubmit, submitting, success, fail } = this.props

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="panel-title">Change Email</div>
        </div>
        <div className="panel-body">
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> Email has been successfully changed!
          </Alert>}

          {fail && fail.id &&
          <Alert bsStyle="danger">
            <strong>Woops! </strong>
            {(() => {
              switch (fail.id) {
                case 'InvalidBodyError': return 'Email is invalid'
                case 'EmailTakenError': return 'Email is already taken'
                default: return 'Something went wrong'
              }
            })()}
          </Alert>}

          <form onSubmit={handleSubmit(this.save)}>
            <Input object={email} label="Email" type="email" size="lg" focus />
            <button type="submit" className="btn btn-primary" disabled={pristine || invalid || submitting}>
              {submitting ? ' Saving...' : ' Change Email'}
            </button>
          </form>
        </div>
      </div>
    )
  }
}
