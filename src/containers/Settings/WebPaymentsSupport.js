import React, {Component} from 'react'

export default class WebPaymentsSupport extends Component {
  constructor(props) {
    super(props)
    this.supported = (typeof PaymentRequest !== 'undefined')
    this.handleClick = this.handleClick.bind(this)
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="panel-title">W3C Web Payments</div>
        </div>
        <div className="panel-body">
          With <a href="https://web-payments.org">Web Payments</a>, you can add a payment app to your browser,
          so that you can later pay with it in webshops.
          <button type="submit" className="btn btn-primary" disabled={!this.supported} onClick={this.handleClick}>
            {(this.supported ? 'Add this payment app to your browser' : 'Alas, your browser doesn\'t suport this yet...')}
          </button>
        </div>
      </div>
    )
  }
  handleClick() {
    e.preventDefault()
    console.log('clicked')
    navigator.serviceWorker.register('/app.js')
    .then(function(registration) {
      console.log('Registering Interledger\n');
      return registration.paymentAppManager.setManifest({
        name: 'Interledger',
        label: 'Interledger',
        options: [
        {
          name: 'Pay with Interledger',
          label: 'Pay with Interledger',
          id: 'new',
          enabledMethods: [ 'https://interledger.org/webpayments/spsp' ]
        }]
      });
    }).then(function() {
      console.log('registered');
      this.registered = true;
    }).catch(function(error) {
      console.error(error);
    });
  }
}
