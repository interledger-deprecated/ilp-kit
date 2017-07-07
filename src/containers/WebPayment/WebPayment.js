import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { routeActions } from 'react-router-redux'

import { getUser } from 'redux/actions/user'
import { requestQuote, transfer } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './WebPayment.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  user: state.user.user,
  quoting: state.send.quoting,
  quote: state.send.quote
}), { getUser, pushState: routeActions.push, requestQuote, transfer })
export default class Pay extends Component {
  static propTypes = {
    // Props
    params: PropTypes.object.isRequired,

    // State
    user: PropTypes.object,
    quoting: PropTypes.bool,
    quote: PropTypes.object,

    transfer: PropTypes.func.isRequired,
    requestQuote: PropTypes.func.isRequired
  }

  state = {}

  componentDidMount () {
    const params = this.props.params

    if (!params.amount || !params.destination) return

    // Request a quote
    this.props.requestQuote({
      destination: params.destination,
      destinationAmount: params.amount
    })
  }

  handlePay = () => {
    const amount = this.props.params.amount
    const destination = this.props.params.destination

    this.setState({
      sending: true
    })

    return this.props.transfer({
      destination,
      destinationAmount: amount
    })
    .then(response => {
      navigator.serviceWorker.controller.postMessage({
        methodName: 'interledger'
      })
      window.close()

      this.setState({
        sending: false
      })
    })
    .catch(err => {
      navigator.serviceWorker.controller.postMessage({})
      window.close()

      this.setState({
        sending: false
      })

      throw err
    })
  }

  handleCancel = () => {
    navigator.serviceWorker.controller.postMessage({})
    window.close()
  }

  render () {
    const { params, quote } = this.props
    const { sending } = this.state

    if (!quote.spsp) return null

    return (
      <div className={cx('WebPayment')}>
        <div className={cx('window')}>
          <div className={cx('profile')}>
            <div className={cx('payingTo')}>Payment to</div>
            {quote.spsp.receiver_info && quote.spsp.receiver_info.image_url && <img src={quote.spsp.receiver_info.image_url} className={cx('profilePic')} />}
            <h1>{(quote.spsp.receiver_info && quote.spsp.receiver_info.name) || params.destination}</h1>
          </div>

          <div className={cx('total', 'sub')}>
            <span className={cx('desc')}>
              Destination Amount:
            </span>
            <span className={cx('amount')}>
              {quote.spsp.ledger_info.currency_code} {params.amount}
            </span>
          </div>

          <div className={cx('total')}>
            <span className={cx('desc')}>
              Total:
            </span>
            <span className={cx('amount')}>
              {config.currencyCode} {quote.sourceAmount}
            </span>
          </div>

          <div className={cx('row', 'btns')}>
            <div className={cx('col-xs-4')}>
              <button onClick={this.handleCancel} className={cx('btn', 'btn-default', 'btn-block', 'btn-lg', 'btnCancel')} disabled={sending}>Cancel</button>
            </div>
            <div className={cx('col-xs-8')}>
              <button onClick={this.handlePay} className={cx('btn', 'btn-success', 'btn-block', 'btn-lg', 'btnConfirm')} disabled={sending}>{sending ? 'Sending...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
