import React, {Component, PropTypes} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import {connect} from 'react-redux'
import * as historyActions from 'redux/actions/history'

import { HistoryItem } from 'components'

import classNames from 'classnames/bind'
import styles from './History.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    history: state.history.history,
    loading: state.history.loading,
    user: state.auth.user
  }),
  historyActions)
export default class Home extends Component {
  static propTypes = {
    load: PropTypes.func,
    history: PropTypes.array,
    user: PropTypes.object,
    loading: PropTypes.bool,
    toggleJson: PropTypes.func
  }

  // Load the history
  componentDidMount() {
    if (!this.props.history.length) {
      this.props.load()
    }
  }

  render() {
    const {history, user, toggleJson, loading} = this.props

    return (
      <ul className={cx('list')}>
        {history && history.length > 0 &&
          <ReactCSSTransitionGroup transitionName={{
            enter: cx('enter'),
            enterActive: cx('enter-active'),
            leave: cx('leave'),
            leaveActive: cx('leave-active')
          }} transitionEnterTimeout={1000} transitionLeaveTimeout={300}>
          {history && history.map(item => {
            return (
              <li key={item.id}>
                <HistoryItem item={item} user={user} toggleJson={toggleJson}/>
              </li>
            )
          })}
          </ReactCSSTransitionGroup>}

        {loading && <li className={cx('loading')}>Loading...</li>}
      </ul>
    )
  }
}
