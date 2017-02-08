import React, {Component, PropTypes} from 'react'
import { reduxForm } from 'redux-form'

import { add } from 'redux/actions/peer'

import peerValidation from './PeerValidation'

import { successable } from 'decorators'
import { resetFormOnSuccess } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './PeerAddForm.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@reduxForm({
  form: 'peerAdd',
  fields: ['hostname', 'limit', 'currency'],
  validate: peerValidation
}, null, { add })
@successable()
@resetFormOnSuccess('peerAdd')
export default class PeerAddForm extends Component {
  static propTypes = {
    add: PropTypes.func,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,
    initializeForm: PropTypes.func,
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
    return this.props.add(data)
      .then(() => {
        this.props.tempSuccess()
        this.props.resetData()
      })
      .catch(this.props.permFail)
  }

  render() {
    const { invalid, handleSubmit, submitting, success, fail, fields: { hostname, limit, currency } } = this.props

    return (
      <div className={cx('PeerAddForm')}>
        {success &&
        <Alert bsStyle="success">
          Peer has been added!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle="danger">
          {fail.message}
        </Alert>}

        <form onSubmit={handleSubmit(this.handleSubmit)}>
          <div className="form-group">
            <div className={cx('row')}>
              <div className={cx('col-sm-5')}>
                <Input object={hostname} label="Hostname" size="lg" focus />
              </div>
              <div className={cx('col-sm-2')}>
                <Input object={limit} label="Limit" size="lg" />
              </div>
              <div className={cx('col-sm-2')}>
                <Input object={currency} label="Currency" size="lg" />
              </div>
              <div className={cx('col-sm-3')}>
                <button type="submit" className={cx('btn', 'btn-lg', 'btn-success', 'btn-block', 'btn-submit')}
                        disabled={invalid || submitting}>
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}
