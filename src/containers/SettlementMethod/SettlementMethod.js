import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import { routeActions } from 'react-router-redux'

import ButtonDanger from 'components/ButtonDanger/ButtonDanger'

import SettlementPaypal from '../SettlementPaypal/SettlementPaypal'
import SettlementBitcoin from '../SettlementBitcoin/SettlementBitcoin'
import SettlementRipple from '../SettlementRipple/SettlementRipple'
import SettlementEthereum from '../SettlementEthereum/SettlementEthereum'
import SettlementCustom from '../SettlementCustom/SettlementCustom'

import { get, update, updateLogo, remove } from 'redux/actions/settlement_method'

import classNames from 'classnames/bind'
import styles from './SettlementMethod.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    list: state.settlementMethod.list
  }),
  { get, update, updateLogo, remove, pushState: routeActions.push })
export default class SettlementMethod extends Component {
  static propTypes = {
    method: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired,
    updateLogo: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
  }

  state = {}

  handleToggle = () => {
    this.props.update(this.props.method.id, {
      enabled: !this.props.method.enabled
    })
  }

  // TODO:UX confirmation
  handleDelete = () => {
    this.props.pushState('/settlement')
    this.props.remove(this.props.method.id)
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

  handleToggleForm = () => {
    this.setState({
      ...this.state,
      showEditForm: !this.state.showEditForm
    })
  }

  renderLogo = method => {
    if (method.type === 'paypal') return <img src='/paypal.png' />
    if (method.type === 'bitcoin') return <img src='/bitcoin.png' />
    if (method.type === 'ripple') return <img src='/ripple.png' />
    if (method.type === 'ethereum') return <img src='/ethereum.png' />

    if (!method.logo) {
      return method.name || 'Unnamed'
    }

    return <img src={method.logoUrl} />
  }

  renderForm = () => {
    const { method } = this.props

    return (
      <div className={cx('form')}>
        <Helmet>
          <title>{method.name}</title>
        </Helmet>

        <div className={cx('row', 'row-sm', 'enableBox')}>
          <div className={cx('col-sm-offset-8', 'col-sm-2')}>
            {!method.enabled &&
            <button className={cx('btn', 'btn-success', 'btn-block')} onClick={this.handleToggle}>
              Enable
            </button>}

            {method.enabled &&
            <button className={cx('btn', 'btn-block')} onClick={this.handleToggle}>
              Disable
            </button>}
          </div>
          <div className={cx('col-sm-2')}>
            <ButtonDanger onConfirm={this.handleDelete} id={method.id} className={cx('btn-block')} />
          </div>
        </div>

        {method.type === 'paypal' && <SettlementPaypal method={method} />}
        {method.type === 'bitcoin' && <SettlementBitcoin />}
        {method.type === 'ripple' && <SettlementRipple />}
        {method.type === 'ethereum' && <SettlementEthereum />}
        {method.type === 'custom' && <SettlementCustom method={method} />}
      </div>
    )
  }

  render () {
    const { method } = this.props
    const { showEditForm } = this.state

    if (!method) return null

    return (
      <div className={cx('SettlementMethod')}>
        <div className={cx('row', 'row-sm')}>
          <div className={cx('col-sm-8', 'logoBox')}>
            {this.renderLogo(method)}
          </div>
          <div className={cx('col-sm-2', !method.enabled && 'disabled')}>
            {method.enabled && 'Enabled'}
            {!method.enabled && 'Disabled'}
          </div>
          <div className={cx('col-sm-2')}>
            <button className={cx('btn', 'btn-default', 'btn-block')} onClick={this.handleToggleForm}>Edit</button>
          </div>
        </div>
        {showEditForm && this.renderForm()}
      </div>
    )
  }
}
