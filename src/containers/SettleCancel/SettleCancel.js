import React, { Component, PropTypes } from 'react'

import classNames from 'classnames/bind'
import styles from './SettleCancel.scss'
const cx = classNames.bind(styles)

export default class SettleCancel extends Component {
  static propTypes = {
  }

  state = {}

  componentDidMount() {
    this.setState({
      hostname: location.hostname
    })
  }

  render() {
    const { location: { query } } = this.props
    const { hostname } = this.state

    return (
      <div className={cx('SettleCancel')}>
        <i className={cx('fa', 'fa-ban', 'icon')} />

        <h3>
          <b>{query.amount} {query.currency}</b> settlement between <b>{hostname}</b> and <b>{query.peer}</b> has been cancelled!
        </h3>

        <a href={`http://${query.peer}`} className={cx('goBack')}>
          back to {query.peer}
        </a>
      </div>
    )
  }
}
