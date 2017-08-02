import React, { Component } from 'react'

import classNames from 'classnames/bind'
import styles from './SettlementCancel.scss'
const cx = classNames.bind(styles)

export default class SettlementCancel extends Component {
  render () {
    return (
      <div className={cx('SettlementCancel')}>
        <i className={cx('fa', 'fa-frown-o', 'icon')} />

        <h3>
          Settlement cancelled or failed
        </h3>
      </div>
    )
  }
}
