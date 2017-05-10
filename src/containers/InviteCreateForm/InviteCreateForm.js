import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

import { create } from 'redux/actions/invite'

import inviteValidation from './InviteValidation'

import { successable, resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './InviteCreateForm.scss'

import Input from 'components/Input/Input'

const cx = classNames.bind(styles)

@connect(null, {create})
@reduxForm({
  form: 'inviteCreate',
  validate: inviteValidation
})
@successable()
@resetFormOnSuccess('inviteCreate')
export default class InviteCreateForm extends Component {
  static propTypes = {
    create: PropTypes.func,

    // Form
    invalid: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,

    // Successable
    tempSuccess: PropTypes.func,
    fail: PropTypes.any,
    reset: PropTypes.func
  }

  handleSubmit = (data) => {
    return this.props.create(data).then(() => {
      this.props.tempSuccess()
      this.props.reset()
    })
  }

  render () {
    const { invalid, handleSubmit, submitting, fail } = this.props

    return (
      <div>
        {fail && fail.id &&
        <Alert bsStyle='danger'>
          Something went wrong
        </Alert>}

        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <div className='form-group'>
            <div className='row'>
              <div className={cx('col-sm-offset-7', 'col-sm-3')}>
                <Field
                  name='amount'
                  component={Input}
                  label='Amount'
                  size='lg'
                  focus />
              </div>
              <div className={cx('col-sm-2')}>
                <button type='submit' className={cx('btn', 'btn-lg', 'btn-success', 'btn-block', 'btn-submit')}
                  disabled={invalid || submitting}>
                  {submitting ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}
