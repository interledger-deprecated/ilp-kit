import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementPaypal.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({

  }),
  {})
export default class SettlementPaypal extends Component {
  static propTypes = {
  }

  render() {
    const { } = this.props

    return (
      <div className={cx('SettlementPaypal')}>
        <Helmet title={'Paypal - Settlement'} />

        Paypal
      </div>
    )
  }
}
