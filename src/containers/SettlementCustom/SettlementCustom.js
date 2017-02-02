import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import Helmet from 'react-helmet'
import DropzoneComponent from 'react-dropzone-component'

import classNames from 'classnames/bind'
import styles from './SettlementCustom.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

import { update } from 'redux/actions/settlement_method'

@reduxForm({
  form: 'settlementMethod',
  fields: ['name', 'description', 'logo', 'uri'],
}, state => ({
}), { update })
export default class SettlementCustom extends Component {
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
    props.initializeForm({
      name: props.method.name || undefined,
      description: props.method.description || undefined,
      logo: props.method.logo || undefined,
      uri: props.method.uri || undefined
    })
  }

  handleSave = data => {
    this.props.update(this.props.method.id, data)
  }

  render() {
    const { handleSubmit, fields: { name, description, uri },
      pristine, invalid, submitting, method } = this.props

    return (
      <div className={cx('SettlementCustom')}>
        <Helmet title={'Custom - Settlement'} />

        <div className={cx('row', 'form')}>
          <div className="col-sm-12">
            <form onSubmit={handleSubmit(this.handleSave)}>
              <Input object={name} label="Settlement Method Name" size="lg" />
              <Input object={description} label="Description" size="lg" />
              <Input object={uri} label="Uri" size="lg" />
              <div className="clearfix">
                <div className={cx('logoField', method.logo || 'full')}>
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
                </div>
                {method.logo &&
                <div className={cx('logoBox')}>
                  <img src={method.logoUrl} className={cx('logo')} />
                </div>}
              </div>

              <button type="submit" className="btn btn-success pull-right"
                      disabled={pristine || invalid || submitting}>
                {submitting ? ' Saving...' : ' Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
}
