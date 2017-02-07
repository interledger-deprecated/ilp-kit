import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import { add } from 'redux/actions/settlement_method'
import { routeActions } from 'react-router-redux'

import classNames from 'classnames/bind'
import styles from './SettlementAddButton.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  list: state.settlementMethod.list
}), { add, pushState: routeActions.push })
export default class SettlementAddButton extends Component {
  static propTypes = {
    list: PropTypes.array,
    add: PropTypes.func.isRequired
  }

  state = {
    typeList: []
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.list && this.props.list !== nextProps.list) {
      this.setState({
        ...this.state,
        typeList: nextProps.list.map(method => {
          return method.type
        })
      })
    }
  }

  handleOpen = e => {
    e.preventDefault()

    this.setState({
      ...this.state,
      open: true
    })
  }

  handleAdd = (type, e) => {
    e.preventDefault()

    this.props.add({ type })
      .then(method => {
        this.props.pushState('/settlement/' + method.id)
      })
      .catch(() => {

      })
  }

  render() {
    const { } = this.props
    const { open, typeList } = this.state

    return (
      <div className={cx('SettlementAddButton')}>
        {!open &&
        <a href="" className={cx('panel', 'panel-default', 'button')} onClick={this.handleOpen}>
          <div className="panel-body">
            + Add a Settlement Method
          </div>
        </a>}

        {open &&
        <div className={cx('panel', 'panel-default', 'options')}>
          <div className="panel-body">
            {typeList.indexOf('paypal') === -1 &&
            <a href="" onClick={this.handleAdd.bind(this, 'paypal')} className={cx('option')}>
              <img src="/paypal.png" />
            </a>}

            {/* {typeList.indexOf('bitcoin') === -1 &&
            <a href="" onClick={this.handleAdd.bind(this, 'bitcoin')} className={cx('option')}>
              <img src={require('../Settlement/bitcoin.png')} />
            </a>}

            {typeList.indexOf('ripple') === -1 &&
            <a href="" onClick={this.handleAdd.bind(this, 'ripple')} className={cx('option')}>
              <img src={require('../Settlement/ripple.png')} />
            </a>}

            {typeList.indexOf('etherium') === -1 &&
            <a href="" onClick={this.handleAdd.bind(this, 'etherium')} className={cx('option')}>
              <img src={require('../Settlement/etherium.png')} />
            </a>} */}

            {/* Not checking here, there could be multiple custom methods */}
            <a href="" onClick={this.handleAdd.bind(this, 'custom')} className={cx('option')}>
              Add a Custom Settlement Method
            </a>
          </div>
        </div>}
      </div>
    )
  }
}
