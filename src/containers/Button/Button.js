import React, { Component } from 'react'
import PropTypes from 'prop-types'

import PayButton from 'components/PayButton/PayButton'

import classNames from 'classnames/bind'
import styles from './Button.scss'
const cx = classNames.bind(styles)

export default class Button extends Component {
  // TODO config is not in the context anymore
  static contextTypes = {
    config: PropTypes.object
  };

  render () {
    const config = this.context.config

    return (
      <div className='panel panel-default'>
        <div className='panel-body'>
          <h2>Pay Button</h2>
          <div>
            Pay Button is the best payment flow, on web and mobile.
            Pay Button builds on top of ILP to provide your users with a streamlined,
            payment experience that is constantly improving.
          </div>
          <div className='row'>
            <div className='col-sm-6'>
              <h3>Demo</h3>
              <p>Try the demo below</p>
              <div>
                <PayButton destination={config.ledgerUri + '/accounts/bob'} amount='10'
                  currencyCode='USD' countryCode='US'>Make Payment</PayButton>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-sm-12'>
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
                  '      account: "' + config.ledgerUri + '/accounts/bob"\n' +
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
      </div>
    )
  }
}
