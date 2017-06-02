import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import * as authActions from 'redux/actions/auth'
import { asyncConnect } from 'redux-connect'

import SendForm from 'containers/SendForm/SendForm'
import LoginForm from 'components/LoginForm/LoginForm'

import classNames from 'classnames/bind'
import styles from './Widget.scss'
const cx = classNames.bind(styles)

@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    const promises = []

    if (!authActions.isLoaded(getState())) {
      promises.push(dispatch(authActions.load()))
    }

    // Server config
    if (!getState().auth.config.ledgerUri) {
      promises.push(dispatch(authActions.loadConfig()))
    }

    return Promise.all(promises)
  }
}])
@connect(
  state => ({
    user: state.auth.user,
    loginFail: state.auth.fail,
    config: state.auth.config
  }),
  // Is this cool? Seems like it could be a bad idea
  authActions)
export default class Widget extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    location: PropTypes.object,
    loginFail: PropTypes.object,
    config: PropTypes.object
  }

  static childContextTypes = {
    config: PropTypes.object
  }

  getChildContext () {
    return {
      config: this.props.config
    }
  }

  componentDidMount () {
    // TODO find a better place for this
    if (document) {
      document.body.style.backgroundColor = 'rgba(0,0,0,0.5)'
    }
  }

  // TODO should also close on ESC
  handleClose = (event) => {
    event.preventDefault()
    parent.postMessage('close', '*')
  }

  render () {
    let destinationName = this.props.location.query.account.split('/')
    destinationName = destinationName[destinationName.length - 1]
    const data = {
      currencyCode: this.props.location.query.currencyCode,
      destinationAmount: this.props.location.query.amount,
      destination: this.props.location.query.account
    }

    const { user, login, loginFail } = this.props

    return (
      <div>
        <div className={cx('before')} />
        <div className={cx('container')}>
          <a href='' className={cx('fa', 'fa-close', 'close')} onClick={this.handleClose} />
          <div className={cx('title')}>FiveBellsWallet.com</div>
          <div className={cx('description')}>
            So you wanna pay {data.currencyCode} {data.amount} to {destinationName}
          </div>

          {user &&
          <SendForm data={data} />}

          {!user &&
          <LoginForm login={login} fail={loginFail} />}
        </div>
      </div>
    )
  }
}
