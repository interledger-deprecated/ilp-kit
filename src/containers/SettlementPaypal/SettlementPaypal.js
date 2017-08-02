import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementPaypal.scss'

import Input from 'components/Input/Input'
import InputRaw from 'components/InputRaw/InputRaw'

import { successable } from 'decorators'

import Alert from 'react-bootstrap/lib/Alert'

import { update } from 'redux/actions/settlement_method'

const cx = classNames.bind(styles)

@connect(state => ({
}), { update })
@reduxForm({
  form: 'settlementPaypal'
})
@successable()
export default class SettlementPaypal extends Component {
  static propTypes = {
    // Props
    method: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired,

    // Form
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    fail: PropTypes.any
  }

  componentWillMount () {
    this.updateMethod()
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.method !== nextProps.method) {
      this.updateMethod(nextProps)
    }
  }

  updateMethod = (props = this.props) => {
    if (!props.method.options) return

    props.initialize({
      clientId: props.method.options.clientId || undefined,
      secret: props.method.options.secret || undefined,
      sandbox: props.method.options.sandbox || undefined
    })
  }

  handleSave = data => {
    this.props.update(this.props.method.id, { options: data })
      .then(this.props.tempSuccess)
      .catch(this.props.permFail)
  }

  render () {
    const { handleSubmit, pristine, invalid, submitting, success, fail } = this.props

    return (
      <div className={cx('SettlementPaypal')}>
        <Helmet>
          <title>Paypal - Settlement</title>
        </Helmet>

        {success &&
        <Alert bsStyle='success'>
          Settlement method has been updated!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle='danger'>
          Something went wrong
        </Alert>}

        <form onSubmit={handleSubmit(this.handleSave)} className={cx('clearfix')}>
          <Field
            name='clientId'
            component={Input}
            label='Client ID'
            size='lg' />
          <Field
            name='secret'
            component={Input}
            label='Secret'
            size='lg' />

          <div className='checkbox check-success'>
            <Field
              name='sandbox'
              component={InputRaw}
              type='checkbox'
              id='sandbox' />
            <label htmlFor='sandbox'>Sandbox (are these Paypal Sandbox
              credentials?)</label>
          </div>

          <button type='submit' className='btn btn-success pull-right'
            disabled={pristine || invalid || submitting}>
            {submitting ? ' Saving...' : ' Save'}
          </button>
        </form>
      </div>
    )
  }
}
