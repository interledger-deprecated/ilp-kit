import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementBitcoin.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({

  }),
  {})
export default class SettlementBitcoin extends Component {
  static propTypes = {
  }

  render() {
    const { } = this.props

    return (
      <div className={cx('SettlementBitcoin')}>
        <Helmet title={'Bitcoin - Settlement'} />

        Bitcoin
      </div>
    )
  }
}
