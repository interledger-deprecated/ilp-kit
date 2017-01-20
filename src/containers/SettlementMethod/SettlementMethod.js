import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import { get, update } from 'redux/actions/settlement_method'

import classNames from 'classnames/bind'
import styles from './SettlementMethod.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  list: state.settlementMethod.list
}), { get, update })
export default class SettlementMethod extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired
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
        this.setState({
          ...this.state,
          method
        })
      })
  }

  handleToggle = () => {
    this.props.update(this.state.method.id, {
      enabled: !this.state.method.enabled
    })
  }

  render() {
    const { method } = this.state

    return (
      <div className={cx('SettlementMethod')}>
        <Helmet title={method.name} />

        <div className={cx('text-right')}>
          {!method.enabled &&
          <button className={cx('btn', 'btn-primary')} onClick={this.handleToggle}>
            Enable
          </button>}

          {method.enabled &&
          <button className={cx('btn', 'btn-default')} onClick={this.handleToggle}>
            Disable
          </button>}
        </div>

        {method.type}
      </div>
    )
  }
}
