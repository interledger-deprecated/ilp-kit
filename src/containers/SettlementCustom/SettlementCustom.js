import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import Helmet from 'react-helmet'
import DropzoneComponent from 'react-dropzone-component'

import classNames from 'classnames/bind'
import styles from './SettlementCustom.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@reduxForm({
  form: 'settlementMethod',
  fields: ['name', 'description', 'logo', 'uri'],
}, state => ({
  list: state.settlementMethod.list
}), {})
export default class SettlementCustom extends Component {
  static propTypes = {
    // Props
    method: PropTypes.object.isRequired,
    handleSave: PropTypes.func.isRequired,

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
    props.initializeForm({
      name: this.props.method.name || undefined,
      description: this.props.method.description || undefined,
      logo: this.props.method.logo || undefined,
      uri: this.props.method.uri || undefined
    })
  }

  render() {
    const { handleSubmit, fields: { name, description, uri },
      pristine, invalid, submitting, handleSave, method } = this.props

    return (
      <div className={cx('SettlementCustom')}>
        <Helmet title={'Custom - Settlement'} />

        <div className={cx('row', 'form')}>
          <div className="col-sm-12">
            <form onSubmit={handleSubmit(handleSave)}>
              <Input object={name} label="Settlement Method Name" size="lg" />
              <Input object={description} label="Description" size="lg" />
              <Input object={uri} label="Uri" size="lg" />
              {method.logo && <img src={method.logoUrl} className={cx('logo')} />}
              <DropzoneComponent
                config={{
                  showFiletypeIcon: false,
                  postUrl: '/api/settlement_methods/' + method.id + '/logo',
                  maxFiles: 1
                }}
                eventHandlers={this.dropzoneEventHandlers}
                className={cx('dropzone', 'dropzoneLocal')}>
                <div className="dz-message">
                  <i className="fa fa-cloud-upload" />
                  Logo: Drop an image or click to upload
                </div>
              </DropzoneComponent>

              <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
                {submitting ? ' Saving...' : ' Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
}
