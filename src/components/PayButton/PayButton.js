import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PayButton extends Component {
  // TODO better validation
  static propTypes = {
    children: PropTypes.string,
    destination: PropTypes.string,
    amount: PropTypes.string,
    currencyCode: PropTypes.string,
    countryCode: PropTypes.string
  }

  // TODO look for a specific message
  componentDidMount () {
    window.addEventListener('message', () => {
      if (document.getElementsByName('payments_polyfill')[0]) {
        document.getElementsByName('payments_polyfill')[0].remove()
      }
    })
  }

  makePayment = (event) => {
    event.preventDefault()

    navigator.requestPayment(['interledger'], {
      amount: this.props.amount,
      currencyCode: this.props.currencyCode,
      countryCode: this.props.countryCode
    }, {
      interledger: {
        account: this.props.destination
      }
    })

    tracker.track('PayButton click')
  }

  render () {
    const { children } = this.props

    return (
      <div>
        <script src='https://web-payments.net/polyfill.js' />
        <button className='btn btn-success btn-lg' onClick={this.makePayment}>{children}</button>
      </div>
    )
  }
}
