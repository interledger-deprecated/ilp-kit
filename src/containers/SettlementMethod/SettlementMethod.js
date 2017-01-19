import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import { get } from 'redux/actions/settlement_method'

import classNames from 'classnames/bind'
import styles from './SettlementMethod.scss'
const cx = classNames.bind(styles)

@connect(state => ({

}), { get })
export default class SettlementMethod extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    get: PropTypes.func.isRequired
  }

  state = {
    method: {}
  }

  componentWillMount() {
    this.initMethod()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.id !== nextProps.params.id) {
      this.initMethod(nextProps)
    }
  }

  initMethod = (props = this.props) => {
    props.get(props.params.id)
      .then(method => {
        this.setState({
          ...this.state,
          method
        })
      })
  }

  render() {
    const { method } = this.state

    return (
      <div className={cx('SettlementMethod')}>
        <Helmet title={method.name} />

        {method.type}
      </div>
    )
  }
}
