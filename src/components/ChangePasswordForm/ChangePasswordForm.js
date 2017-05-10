import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { reduxForm, Field, SubmissionError } from 'redux-form'
import Validation from './Validation'

import Alert from 'react-bootstrap/lib/Alert'

import Input from 'components/Input/Input'

import { successable } from 'decorators'

@reduxForm({
  form: 'changePassword',
  validate: Validation
})
@successable()
export default class ChangePasswordForm extends Component {
  static propTypes = {
    username: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,

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

  handleSubmit = (formData) => {
    const data = {
      ...formData,
      username: this.props.username,
      code: this.props.code
    }

    return this.props.submitAction(data)
      .then(() => {
        this.props.permSuccess()

        tracker.track('Change password')
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
          Your password has been updated successfully
        </Alert>}

        {error && error.id &&
        <Alert bsStyle='danger'>
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
            <Field
              name='password'
              component={Input}
              type='password'
              label='Password'
              size='lg'
              focus />
            <Field
              name='repeatPassword'
              component={Input}
              type='password'
              label='Repeat Password'
              size='lg' />
          </div>
          <div className='row'>
            <button type='submit' className='btn btn-success' disabled={pristine || (invalid && !submitFailed) || submitting}>
              {submitting ? ' Submitting...' : ' Submit'}
            </button>
          </div>
        </div>}
      </form>
    )
  }
}
