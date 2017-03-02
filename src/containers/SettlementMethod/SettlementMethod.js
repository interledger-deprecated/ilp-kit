import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import { routeActions } from 'react-router-redux'

import { ButtonDanger } from 'napo'

import SettlementPaypal from '../SettlementPaypal/SettlementPaypal'
import SettlementBitcoin from '../SettlementBitcoin/SettlementBitcoin'
import SettlementRipple from '../SettlementRipple/SettlementRipple'
import SettlementEtherium from '../SettlementEtherium/SettlementEtherium'
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
    params: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    updateLogo: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
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
    const { method } = this.state

    if (!method) return null

    return (
      <div className={cx('SettlementMethod')}>
        <Helmet title={method.name} />

        <div className={cx('row', 'row-sm', 'enableBox')}>
          <div className={cx('col-sm-6', 'title')}>
            {method.name}
          </div>
          <div className={cx('col-sm-3')}>
            {!method.enabled &&
            <button className={cx('btn', 'btn-success', 'btn-block')} onClick={this.handleToggle}>
              Enable
            </button>}

            {method.enabled &&
            <button className={cx('btn', 'btn-default', 'btn-block')} onClick={this.handleToggle}>
              Disable
            </button>}
          </div>
          <div className={cx('col-sm-3')}>
            <ButtonDanger onConfirm={this.handleDelete} id={method.id} className={cx('btn-block')} />
          </div>
        </div>

        {method.type === 'paypal' && <SettlementPaypal method={method} />}
        {method.type === 'bitcoin' && <SettlementBitcoin />}
        {method.type === 'ripple' && <SettlementRipple />}
        {method.type === 'etherium' && <SettlementEtherium />}
        {method.type === 'custom' && <SettlementCustom method={method} />}
      </div>
    )
  }
}
