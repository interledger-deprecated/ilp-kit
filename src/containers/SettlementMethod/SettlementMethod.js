import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import DropzoneComponent from 'react-dropzone-component'
import Helmet from 'react-helmet'

import { routeActions } from 'react-router-redux'

import SettlementPaypal from '../SettlementPaypal/SettlementPaypal'
import SettlementBitcoin from '../SettlementBitcoin/SettlementBitcoin'
import SettlementRipple from '../SettlementRipple/SettlementRipple'
import SettlementEtherium from '../SettlementEtherium/SettlementEtherium'

import { get, update, updateLogo, remove } from 'redux/actions/settlement_method'

import { successable } from 'decorators'
import Input from 'components/Input/Input'

import Alert from 'react-bootstrap/lib/Alert'

import classNames from 'classnames/bind'
import styles from './SettlementMethod.scss'
const cx = classNames.bind(styles)

@reduxForm({
  form: 'settlementMethod',
  fields: ['name', 'description', 'logo', 'uri'],
}, state => ({
  list: state.settlementMethod.list
}), { get, update, updateLogo, remove, pushState: routeActions.push })
@successable()
export default class SettlementMethod extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    updateLogo: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired,

    // Form
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    initializeForm: PropTypes.func.isRequired,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    fail: PropTypes.any
  }

  state = {
    method: {}
  }

  componentWillMount() {
    this.updateMethod()
  }

  componentWillReceiveProps(nextProps) {
    this.updateMethod(nextProps)
  }

  updateMethod = (props = this.props) => {
    props.get(props.params.id)
      .then(method => {
        if (this.state.method !== method) {
          this.setState({
            ...this.state,
            method
          })

          this.props.initializeForm({
            name: method.name || undefined,
            description: method.description || undefined,
            logo: method.logo || undefined,
            uri: method.uri || undefined
          })
        }
      })
  }

  handleToggle = () => {
    this.props.update(this.state.method.id, {
      enabled: !this.state.method.enabled
    })
  }

  // TODO:UX confirmation
  handleDelete = () => {
    this.props.pushState('/settlement')
    this.props.remove(this.state.method.id)
  }

  handleSave = data => {
    this.props.update(this.state.method.id, data)
      .then(() => {
        this.props.tempSuccess()
      })
  }

  dropzoneEventHandlers = {
    init: (dropzone) => {
      this.dropzone = dropzone
    },
    addedfile: () => {
      // TODO:UX upload progress photo placeholders
    },
    // TODO handle error
    success: (file, response) => {
      setTimeout(() => {
        this.props.updateLogo(response)
      }, 1000)
    },
    complete: (file) => {
      this.dropzone.removeFile(file)
    },
    maxfilesexceeded: (file) => {
      this.removeAllFiles()
      this.addFile(file)
    }
  }

  render() {
    const { handleSubmit, fields: { name, description, uri },
      pristine, invalid, submitting, success, fail } = this.props
    const { method } = this.state

    if (method.type === 'paypal') return <SettlementPaypal />
    if (method.type === 'bitcoin') return <SettlementBitcoin />
    if (method.type === 'ripple') return <SettlementRipple />
    if (method.type === 'etherium') return <SettlementEtherium />

    return (
      <div className={cx('SettlementMethod')}>
        <Helmet title={method.name} />

        <div className={cx('row', 'enableBox')}>
          <div className={cx('col-sm-8', 'title')}>
            {method.name}
          </div>
          <div className={cx('col-sm-2')}>
            {!method.enabled &&
            <button className={cx('btn', 'btn-primary', 'btn-block')} onClick={this.handleToggle}>
              Enable
            </button>}

            {method.enabled &&
            <button className={cx('btn', 'btn-default', 'btn-block')} onClick={this.handleToggle}>
              Disable
            </button>}
          </div>
          <div className={cx('col-sm-2')}>
            <button className={cx('btn', 'btn-default', 'btn-block')} onClick={this.handleDelete}>
              Delete
            </button>
          </div>
        </div>

        {success &&
        <Alert bsStyle="success">
          Settlement Method has been saved!
        </Alert>}

        {fail && fail.id &&
        <Alert bsStyle="danger">
          Something went wrong
        </Alert>}

        <div className={cx('row', 'form')}>
          <div className="col-sm-12">
            <form onSubmit={handleSubmit(this.handleSave)}>
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
