import React, {Component, PropTypes} from 'react'
import { reduxForm } from 'redux-form'

import { create } from 'redux/actions/invite'

import inviteValidation from './InviteValidation'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './InviteCreateForm.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@reduxForm({
  form: 'inviteCreate',
  fields: ['amount'],
  validate: inviteValidation
}, null, {create})
@successable()
@resetFormOnSuccess('inviteCreate')
export default class InviteCreateForm extends Component {
  static propTypes = {
    create: PropTypes.func,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,

    resetData: PropTypes.func,

    // Successable
    permSuccess: PropTypes.func,
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    tempFail: PropTypes.func,
    fail: PropTypes.any,
    reset: PropTypes.func
  }

  handleSubmit = (data) => {
    return this.props.create(data).then(() => {
      this.props.tempSuccess()
      this.props.resetData()
    })
  }

  render() {
    const { invalid, handleSubmit, submitting, success, fail, fields: { amount } } = this.props

    return (
      <div>
        {success &&
        <Alert bsStyle="success">
          Invite code has been created!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle="danger">
          Something went wrong
        </Alert>}

        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <div className="form-group">
            <div className="row">
              <div className={cx('col-sm-offset-7', 'col-sm-3')}>
                <Input object={amount} label="Amount" size="lg" focus />
              </div>
              <div className={cx('col-sm-2')}>
                <button type="submit" className={cx('btn', 'btn-lg', 'btn-success', 'btn-block', 'btn-submit')}
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
