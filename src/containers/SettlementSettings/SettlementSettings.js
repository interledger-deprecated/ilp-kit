import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { routeActions } from 'react-router-redux'

import AnimateEnterLeave from 'components/AnimateEnterLeave/AnimateEnterLeave'

import Dropdown from 'react-bootstrap/lib/Dropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'

import { load, add } from 'redux/actions/settlement_method'

import SettlementMethod from 'containers/SettlementMethod/SettlementMethod'

import classNames from 'classnames/bind'
import styles from './SettlementSettings.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  list: state.settlementMethod.list,
  loaded: state.settlementMethod.loaded
}), { load, add, pushState: routeActions.push })
export default class SettlementSettings extends Component {
  static propTypes = {
    add: PropTypes.func,
    load: PropTypes.func.isRequired,
    list: PropTypes.array,
    loaded: PropTypes.bool
  }

  componentWillMount () {
    if (!this.props.loaded) {
      this.props.load()
    }
  }

  handleAdd = type => e => {
    e && e.preventDefault()

    this.props.add({ type })
  }

  render () {
    const { list } = this.props

    return (
      <div className={cx('SettlementSettings')}>
        <Helmet>
          <title>SettlementSettings</title>
        </Helmet>

        {/* Add new */}
        <div className={cx('header', 'row', 'row-sm')}>
          <div className={cx('col-sm-9')}>
            <h3>Settlement Methods</h3>
          </div>
          <div className={cx('col-sm-3', 'addButtonBox')}>
            <Dropdown id='settlementAddButton' pullRight>
              <Dropdown.Toggle bsStyle='success'>
                Add a Settlement Method
              </Dropdown.Toggle>
              <Dropdown.Menu className={cx('options')}>
                <MenuItem onClick={this.handleAdd('paypal')}>
                  <img src='/paypal.png' className={cx('logo')} /> Paypal
                </MenuItem>
                <MenuItem onClick={this.handleAdd('cash')}>
                  <img src='/cash.png' className={cx('logo')} /> Cash
                </MenuItem>
                <MenuItem onClick={this.handleAdd('custom')}>
                  Custom
                </MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className={cx('list')}>
          {list && list.length > 0 &&
          <AnimateEnterLeave>
            {list.map(method =>
              <div className={cx('settlementMethod')} key={method.id}>
                <SettlementMethod method={method} />
              </div>
            )}
          </AnimateEnterLeave>}

          {/* <div className={cx('col-sm-8')}>
            {list && list.length > 0 && children}

            {!loading && list && list.length < 1 &&
            <div className={cx('noResults')}>
              <i className={cx('fa', 'fa-credit-card-alt')} />
              <h1>No Settlement Methods</h1>
              <div>Use the button on the left to add your first settlement method</div>
            </div>}
          </div> */}
        </div>
      </div>
    )
  }
}
