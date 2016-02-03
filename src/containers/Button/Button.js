import React, {Component} from 'react';

import classNames from 'classnames/bind';
import sharedStyles from '../App/Shared.scss';
import inputStyles from '../App/Inputs.scss';
import styles from './Button.scss';
const cx = classNames.bind({...sharedStyles, ...inputStyles, ...styles});

export default class Button extends Component {
  componentDidMount() {
    window.addEventListener('message', () => {
      if (document.getElementsByName('payments_polyfill')[0]) {
        document.getElementsByName('payments_polyfill')[0].remove();
      }
    });
  }

  makePayment = (amount, event) => {
    event.preventDefault();

    navigator.requestPayment(['interledger'], {
      amount: amount,
      currencyCode: 'USD',
      countryCode: 'US'
    }, {
      interledger: {
        account: 'http://localhost.com/accounts/mellie'
      }
    });
  };

  render() {
    return (
      <div className={cx('box')}>
        <script src="https://web-payments.net/polyfill.js"></script>
        <h2>Pay Button</h2>
        <div>
          Pay Button is the best payment flow, on web and mobile.
          Pay Button builds on top of ILP to provide your users with a streamlined,
          payment experience that is constantly improving.
        </div>
        <div className={cx('row')}>
          <div className={cx('col-sm-6')}>
            <h3>Demo</h3>
            <p>Try the demo below</p>
            <div>
              <button className={cx('btn', 'lu-btn')} onClick={this.makePayment.bind(this, 10)}>Make Payment</button>
            </div>
          </div>
        </div>
        <div className={cx('row')}>
          <div className={cx('col-sm-12')}>
            <h3>Integration</h3>
            <p>You can integrate Pay Button using the code below.</p>
            <p>As we release new Pay Button features, we'll automatically roll
            them out to your existing integration, so that you will always be
            using our latest technology without needing to change a thing.</p>
            <pre>
              {
                '<script src="https://web-payments.net/polyfill.js"></script>\n\n' +

                '<script>\n' +
                'window.addEventListener("message", () => {\n' +
                '  document.getElementsByName("payments_polyfill")[0].remove();\n' +
                '});\n\n' +
                'function makePayment(amount) {\n' +
                '  navigator.requestPayment(["interledger"], {\n' +
                '    amount: amount,\n' +
                '    currencyCode: "USD",\n' +
                '    countryCode: "US"\n' +
                '  }, {\n' +
                '    interledger: {\n' +
                '      account: "http://localhost.com/accounts/mellie"\n' +
                '    }\n' +
                '  });\n' +
                '};\n' +
                '</script>\n\n' +

                '<button onclick="makePayment(10)">Make Payment</button>'
              }
            </pre>
            <h3>Configuration Options</h3>
            <table className={cx('table')}>
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>amount</td>
                  <td>The amount to be sent</td>
                </tr>
                <tr>
                  <td>currencyCode</td>
                  <td>The currency code</td>
                </tr>
                <tr>
                  <td>countryCode</td>
                  <td>The country code</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
