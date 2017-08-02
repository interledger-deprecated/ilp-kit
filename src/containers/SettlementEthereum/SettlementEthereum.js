import React, { Component } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import classNames from 'classnames/bind'
import styles from './SettlementEthereum.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({

  }),
  {})
export default class SettlementEthereum extends Component {
  static propTypes = {
  }

  render () {
    return (
      <div className={cx('SettlementEthereum')}>
        <Helmet>
          <title>Ethereum - Settlement</title>
        </Helmet>

        Ethereum
      </div>
    )
  }
}
