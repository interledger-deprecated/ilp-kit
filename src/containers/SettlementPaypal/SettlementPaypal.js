import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementPaypal.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

import { update } from 'redux/actions/settlement_method'

@reduxForm({
  form: 'settlementPaypal',
  fields: ['clientId', 'secret', 'api'],
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
      api: props.method.options.api || undefined
    })
  }

  handleSave = data => {
    this.props.update(this.props.method.id, { options: data })
  }

  render() {
    const { handleSubmit, fields: { clientId, secret, api },
      pristine, invalid, submitting } = this.props

    return (
      <div className={cx('SettlementPaypal')}>
        <Helmet title={'Paypal - Settlement'} />

        <form onSubmit={handleSubmit(this.handleSave)}>
          <Input object={clientId} label="Client ID" size="lg" />
          <Input object={secret} label="Secret" size="lg" />
          <Input object={api} label="Api" size="lg" />

          <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
            {submitting ? ' Saving...' : ' Save'}
          </button>
        </form>
      </div>
    )
  }
}
