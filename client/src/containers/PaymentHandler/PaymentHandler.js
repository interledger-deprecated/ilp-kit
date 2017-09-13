/* globals config */

import { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { check } from 'redux/actions/webpayments'

@connect(
  state => ({
    user: state.auth.user
  }),
  { check })
export default class PaymentHandler extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    check: PropTypes.func.isRequired
  }

  async componentDidMount () {
    const { user } = this.props

    if ('serviceWorker' in navigator) {
      // Your service-worker.js *must* be located at the top-level directory relative to your site.
      // It won't be able to control pages unless it's located at the same level or higher than them.
      // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
      // See https://github.com/slightlyoff/ServiceWorker/issues/468
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          // Keep the browser support in store
          this.props.check(!!reg.paymentManager)

          if (!reg.paymentManager) return console.warn("Web Payments are not enabled in the browser")

          // updatefound is fired if service-worker.js changes.
          reg.onupdatefound = () => {
            // The updatefound event implies that reg.installing is set see
            // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
            const installingWorker = reg.installing

            installingWorker.onstatechange = () => {
              switch (installingWorker.state) {
                case 'installed':
                  if (navigator.serviceWorker.controller) {
                    // At this point, the old content will have been purged and the fresh content will
                    // have been added to the cache.
                    // It's the perfect time to display a "New content is available please refresh."
                    // message in the page's interface.
                    console.log('New or updated content is available.')
                  } else {
                    // At this point, everything has been precached.
                    // It's the perfect time to display a "Content is cached for offline use." message.
                    console.log('Content is now available offline!')
                  }
                  break

                case 'redundant':
                  console.error('The installing service worker became redundant.')
                  break
                default:
                  console.log('PaymentHandler:61')
              }
            }
          }

          return Promise.all([
            reg.paymentManager.instruments.set(
              user.identifier,
              {
                name: `${config.title} (${user.identifier})`,
                enabledMethods: ['interledger']
              })
          ])
        })
        .catch(e => {
          console.error('Error during service worker registration:', e)
        })
    }
  }

  render () {
    return null
  }
}
