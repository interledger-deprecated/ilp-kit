import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { reduxForm, Field } from 'redux-form'

import { add } from 'redux/actions/receiver'

import receiverValidation from './ReceiverValidation'

import { successable, resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import Input from 'components/Input/Input'

@connect(null, { add })
@reduxForm({
  form: 'receiverAdd',
  validate: receiverValidation
})
@successable()
@resetFormOnSuccess('receiverAdd')
export default class ReceiverAddForm extends Component {
  static propTypes = {
    add: PropTypes.func,

    // Form
    invalid: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    reset: PropTypes.func,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    fail: PropTypes.any
  }

  handleSubmit = (data) => {
    return this.props.add(data).then(() => {
      this.props.tempSuccess()
      this.props.reset()
    })
  }

  render () {
    const { invalid, handleSubmit, submitting, success, fail } = this.props

    return (
      <div>
        {success &&
        <Alert bsStyle='success'>
          Receiver has been added!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle='danger'>
          Something went wrong
        </Alert>}

        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <div className='form-group'>
            <Field
              name='name'
              component={Input}
              label='Name'
              size='lg'
              focus />

            <Field
              name='webhook'
              component={Input}
              label='Webhook URL (HTTPS only)'
              size='lg' />
          </div>

          <div className='row'>
            <div className='col-sm-5'>
              <button type='submit' className='btn btn-complete btn-block'
                disabled={invalid || submitting}>
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}
