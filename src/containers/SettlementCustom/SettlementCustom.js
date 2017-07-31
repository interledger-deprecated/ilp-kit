import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import Helmet from 'react-helmet'
import DropzoneComponent from 'react-dropzone-component'

import Alert from 'react-bootstrap/lib/Alert'
import Input from 'components/Input/Input'

import { successable } from 'decorators'

import classNames from 'classnames/bind'
import styles from './SettlementCustom.scss'

import { update } from 'redux/actions/settlement_method'

import validate from './SettlementCustomValidation'

const cx = classNames.bind(styles)

@connect(state => ({
}), { update })
@reduxForm({
  form: 'settlementMethod',
  validate
})
@successable()
export default class SettlementCustom extends Component {
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
    tempFail: PropTypes.func,
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
    props.change('name', props.method.name || undefined)
    props.change('description', props.method.description || undefined)
    props.change('logo', props.method.logo || undefined)
    props.change('uri', props.method.uri || undefined)
  }

  handleSave = data => {
    this.props.update(this.props.method.id, data)
      .then(this.props.tempSuccess)
      .catch(this.props.tempFail)
  }

  render () {
    const { handleSubmit, pristine, invalid, submitting, method, success, fail } = this.props

    return (
      <div className={cx('SettlementCustom')}>
        <Helmet>
          <title>Custom - Settlement</title>
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
            name='name'
            component={Input}
            label='Settlement Method Name'
            size='lg' />
          <Field
            name='description'
            component={Input}
            label='Description'
            size='lg' />
          <Field
            name='uri'
            component={Input}
            label='Uri'
            size='lg' />
          <div className='clearfix'>
            <div className={cx('logoField', method.logo || 'full')}>
              <DropzoneComponent
                config={{
                  showFiletypeIcon: false,
                  postUrl: '/api/settlement_methods/' + method.id + '/logo',
                  maxFiles: 1
                }}
                eventHandlers={this.dropzoneEventHandlers}
                className={cx('dropzone', 'dropzoneLocal')}>
                <div className='dz-message'>
                  <i className='fa fa-cloud-upload' />
                  Logo: Drop an image or click to upload
                </div>
              </DropzoneComponent>
            </div>
            {method.logo &&
            <div className={cx('logoBox')}>
              <img src={method.logoUrl} className={cx('logo')} />
            </div>}
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
