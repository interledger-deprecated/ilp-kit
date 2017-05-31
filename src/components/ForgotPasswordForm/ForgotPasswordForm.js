import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { reduxForm, Field, SubmissionError } from 'redux-form'
import Validation from './Validation'

import Alert from 'react-bootstrap/lib/Alert'

import Input from 'components/Input/Input'

import { successable } from 'decorators'

@reduxForm({
  form: 'forgotPassword',
  validate: Validation
})
@successable()
export default class ForgotPasswordForm extends Component {
  static propTypes = {
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    submitAction: PropTypes.func.isRequired,
    submitFailed: PropTypes.bool,
    error: PropTypes.object,

    // Successable
    permSuccess: PropTypes.func,
    success: PropTypes.bool
  }

  handleSubmit = (data) => {
    return this.props.submitAction(data)
      .then(() => {
        this.props.permSuccess()

        tracker.track('Forgot password')
      })
      .catch((error) => {
        throw new SubmissionError({_error: error})
      })
  }

  render () {
    const { handleSubmit, error, success, pristine, invalid, submitting, submitFailed } = this.props

    return (
      <form onSubmit={handleSubmit(this.handleSubmit)}>
        {success &&
        <Alert bsStyle='success'>
          We've sent an email to you. Please follow the instructions in that email to change your password
        </Alert>}

        {error && error.id &&
        <Alert bsStyle='danger'>
          {(() => {
            switch (error.id) {
              case 'NotFoundError': return 'Couldn\'t find the user with provided username or email'
              default: return 'Something went wrong'
            }
          })()}
        </Alert>}

        {!success &&
        <div>
          <div>
            <Field
              name='resource'
              component={Input}
              label='Username or Email'
              size='lg'
              focus
              autoCapitalize='off' />
          </div>
          <div className='row'>
            <button type='submit' className='btn btn-success btn-lg' disabled={pristine || (invalid && !submitFailed) || submitting}>
              {submitting ? ' Submitting...' : ' Submit'}
            </button>
          </div>
        </div>}
      </form>
    )
  }
}
