import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementPaypal.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'
import InputRaw from 'components/InputRaw/InputRaw'

import { update } from 'redux/actions/settlement_method'

@reduxForm({
  form: 'settlementPaypal',
  fields: ['clientId', 'secret', 'sandbox'],
}, state => ({
}), { update })
export default class SettlementPaypal extends Component {
  static propTypes = {
    // Props
    method: PropTypes.object.isRequired,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    initializeForm: PropTypes.func.isRequired,
  }

  componentWillMount() {
    this.updateMethod()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.method !== nextProps.method) {
      this.updateMethod(nextProps)
    }
  }

  updateMethod = (props = this.props) => {
    if (!props.method.options) return

    props.initializeForm({
      clientId: props.method.options.clientId || undefined,
      secret: props.method.options.secret || undefined,
      sandbox: props.method.options.sandbox || undefined
    })
  }

  handleSave = data => {
    this.props.update(this.props.method.id, { options: data })
  }

  render() {
    const { handleSubmit, fields: { clientId, secret, sandbox },
      pristine, invalid, submitting } = this.props

    return (
      <div className={cx('SettlementPaypal')}>
        <Helmet title={'Paypal - Settlement'} />

        <form onSubmit={handleSubmit(this.handleSave)}>
          <Input object={clientId} label="Client ID" size="lg" />
          <Input object={secret} label="Secret" size="lg" />

          <div className="checkbox check-success">
            <InputRaw object={sandbox} type="checkbox" id="sandbox" checked={sandbox.value} />
            <label htmlFor="sandbox">Sandbox (are these Paypal Sandbox credentials?)</label>
          </div>

          <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
            {submitting ? ' Saving...' : ' Save'}
          </button>
        </form>
      </div>
    )
  }
}
