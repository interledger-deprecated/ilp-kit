import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { routeActions } from 'react-router-redux'
import { HotKeys } from 'react-hotkeys'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import Dropdown from 'react-bootstrap/lib/Dropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'

import { load, add } from 'redux/actions/settlement_method'

import SettlementMethod from 'containers/SettlementMethod/SettlementMethod'

import classNames from 'classnames/bind'
import styles from './Settlement.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  list: state.settlementMethod.list,
  settlementState: state.settlementMethod,
  loading: state.settlementMethod.loading,
  loaded: state.settlementMethod.loaded
}), { load, add, pushState: routeActions.push })
export default class Settlement extends Component {
  static propTypes = {
    children: PropTypes.object,
    load: PropTypes.func.isRequired,
    params: PropTypes.object,
    pushState: PropTypes.func,
    list: PropTypes.array,
    settlementState: PropTypes.object,
    loading: PropTypes.bool,
    loaded: PropTypes.bool
  }

  componentWillMount() {
    if (!this.props.loaded) {
      this.props.load()
    }
  }

  handleAdd = (type, e) => {
    e && e.preventDefault()

    this.props.add({ type })
  }

  render() {
    const { children, list, loading, settlementState } = this.props

    return (
      <div className={cx('Settlement')}>
        <Helmet title={'Settlement'} />

        {/* Add new */}
        <div className={cx('header', 'row', 'row-sm')}>
          <div className={cx('col-sm-9')}>
            <h3>Settlement Methods</h3>
          </div>
          <div className={cx('col-sm-3', 'addButtonBox')}>
            <Dropdown id="settlementAddButton" pullRight>
              <Dropdown.Toggle bsStyle="success">
                Add a Settlement Method
              </Dropdown.Toggle>
              <Dropdown.Menu className={cx('options')}>
                <MenuItem onClick={this.handleAdd.bind(this, 'paypal')}>
                  <img src="/paypal.png" className={cx('logo')}/>
                </MenuItem>
                <MenuItem onClick={this.handleAdd.bind(this, 'custom')}>
                  Custom
                </MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className={cx('list')}>
          {list && list.length > 0 &&
          <ReactCSSTransitionGroup
            transitionName={{
              enter: cx('enter'),
              enterActive: cx('enterActive'),
              leave: cx('leave'),
              leaveActive: cx('leaveActive')
            }}
            transitionEnterTimeout={1000}
            transitionLeaveTimeout={500}
            component="div">
            {list.map(method =>
              <div className={cx('settlementMethod')} key={method.id}>
                <SettlementMethod method={method} />
              </div>
            )}
          </ReactCSSTransitionGroup>}

          {/*<div className={cx('col-sm-8')}>
            {list && list.length > 0 && children}

            {!loading && list && list.length < 1 &&
            <div className={cx('noResults')}>
              <i className={cx('fa', 'fa-credit-card-alt')} />
              <h1>No Settlement Methods</h1>
              <div>Use the button on the left to add your first settlement method</div>
            </div>}
          </div>*/}
        </div>
      </div>
    )
  }
}
