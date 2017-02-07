import React, { Component, PropTypes } from 'react'

import classNames from 'classnames/bind'
import styles from './SettleSuccess.scss'
const cx = classNames.bind(styles)

export default class SettleSuccess extends Component {
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
      <div className={cx('SettleSuccess')}>
        <i className={cx('fa', 'fa-check', 'icon')} />

        <h3>
          <b>{query.amount} {query.currency}</b> settlement between <b>{hostname}</b> and <b>{query.peer}</b> has been completed!
        </h3>

        <a href={`http://${query.peer}`} className={cx('goBack')}>
          back to {query.peer}
        </a>
      </div>
    )
  }
}
