import React, { Component, PropTypes } from 'react'

import classNames from 'classnames/bind'
import styles from './SettleSuccess.scss'
const cx = classNames.bind(styles)

export default class SettleSuccess extends Component {
  static propTypes = {
    query: PropTypes.object
  }

  render() {
    const { query } = this.props

    return (
      <div>
        <h1 className="title">Settlement completed!</h1>
      </div>
    )
  }
}
