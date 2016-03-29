import React, {Component, PropTypes} from 'react';

export default class PayButton extends Component {
  // TODO better validation
  static propTypes = {
    children: PropTypes.string,
    destination: PropTypes.string,
    amount: PropTypes.string,
    currencyCode: PropTypes.string,
    countryCode: PropTypes.string
  };

  // TODO look for a specific message
  componentDidMount() {
    window.addEventListener('message', () => {
      if (document.getElementsByName('payments_polyfill')[0]) {
        document.getElementsByName('payments_polyfill')[0].remove();
      }
    });
  }

  makePayment = (event) => {
    event.preventDefault();

    navigator.requestPayment(['interledger'], {
      amount: this.props.amount,
      currencyCode: this.props.currencyCode,
      countryCode: this.props.countryCode
    }, {
      interledger: {
        account: this.props.destination
      }
    });
  };

  render() {
    const { children } = this.props;

    return (
      <div>
        <script src="https://web-payments.net/polyfill.js"></script>
        <button className="btn btn-lg" onClick={this.makePayment}>{children}</button>
      </div>
    );
  }
}
