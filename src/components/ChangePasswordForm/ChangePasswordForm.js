import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import Validation from './Validation'

import Alert from 'react-bootstrap/lib/Alert'

import Input from 'components/Input/Input'

import { successable } from 'decorators'

@reduxForm({
  form: 'changePassword',
  fields: ['password', 'repeatPassword'],
  validate: Validation
})
@successable()
export default class ChangePasswordForm extends Component {
  static propTypes = {
    username: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,

    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired,
    submitFailed: PropTypes.bool,
    error: PropTypes.object,

    // Successable
    permSuccess: PropTypes.func,
    success: PropTypes.bool
  }

  handleSubmit = (formData) => {
    const data = {
      ...formData,
      username: this.props.username,
      code: this.props.code
    }

    return this.props.submit(data)
      .then(() => {
        this.props.permSuccess()

        tracker.track('Change password')
      })
      .catch((error) => {
        throw {_error: error}
      })
  }

  render() {
    const { handleSubmit, error, success, fields: {password, repeatPassword}, pristine, invalid, submitting, submitFailed } = this.props

    return (
      <form onSubmit={handleSubmit(this.handleSubmit)}>
        {success &&
        <Alert bsStyle="success">
          Your password has been changed successfully
        </Alert>}

        {error && error.id &&
        <Alert bsStyle="danger">
          {(() => {
            switch (error.id) {
              case 'NotFoundError': return 'Couldn\'t find the user with provided username'
              // TODO:UX should see the invalidCode message even before trying to submit the form
              case 'InvalidBodyError': return error.message
              default: return 'Something went wrong'
            }
          })()}
        </Alert>}

        {!success &&
        <div>
          <div>
            <Input object={password} type="password" label="Password" size="lg" focus />
            <Input object={repeatPassword} type="password" label="Repeat Password" size="lg" />
          </div>
          <div className="row">
            <button type="submit" className="btn btn-complete" disabled={pristine || (invalid && !submitFailed) || submitting}>
              {submitting ? ' Submitting...' : ' Submit'}
            </button>
          </div>
        </div>}
      </form>
    )
  }
}
