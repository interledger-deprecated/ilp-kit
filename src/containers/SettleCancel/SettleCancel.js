import React, { Component, PropTypes } from 'react'

import classNames from 'classnames/bind'
import styles from './SettleCancel.scss'
const cx = classNames.bind(styles)

export default class SettleCancel extends Component {
  static propTypes = {
    query: PropTypes.object
  }

  render() {
    const { query } = this.props

    return (
      <div>
        <h1>Cancelled!</h1>
      </div>
    )
  }
}
