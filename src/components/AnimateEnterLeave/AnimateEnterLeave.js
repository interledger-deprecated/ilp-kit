import React, {Component} from 'react'
import PropTypes from 'prop-types'
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'

import classNames from 'classnames/bind'
import styles from './AnimateEnterLeave.scss'
const cx = classNames.bind(styles)

export default class AnimateEnterLeave extends Component {
  static propTypes = {
    children: PropTypes.any,
    effect: PropTypes.string
  }

  static defaultProps = {
    effect: 'fade'
  }

  render () {
    const { children, effect } = this.props

    return (
      <CSSTransitionGroup
        transitionName={{
          enter: cx('enter'),
          enterActive: cx('enterActive'),
          leave: cx('leave'),
          leaveActive: cx('leaveActive')
        }}
        transitionEnterTimeout={1000}
        transitionLeaveTimeout={500}
        className={cx(effect)}
        component='div'>
        {children}
      </CSSTransitionGroup>
    )
  }
}
