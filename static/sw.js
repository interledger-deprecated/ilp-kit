/* globals self, clients */

let paymentRequestEvent
let paymentRequestResolver

self.addEventListener('paymentrequest', e => {
  paymentRequestEvent = e

  paymentRequestResolver = new PromiseResolver()
  e.respondWith(paymentRequestResolver.promise)

  const identifier = paymentRequestEvent.methodData[0].data.identifier
  const amount = paymentRequestEvent.total.amount.value

  e.openWindow(`https://wallet1.com/webpayment/${identifier}/${amount}`)
    .catch(err => {
      paymentRequestResolver.reject(err)
    })
})

self.addEventListener('message', e => {
  /* if (e.data === 'payment_app_window_ready') {
    sendPaymentRequest()
    return
  } */

  if (e.data.methodName) {
    paymentRequestResolver.resolve(e.data)
  } else {
    paymentRequestResolver.reject(e.data)
  }
})

/* function sendPaymentRequest () {
  // Note that the returned window_client from openWindow is not used since
  // it might be changed by refreshing the opened page.
  // Refer to https://www.w3.org/TR/service-workers-1/#clients-getall
  let options = {
    includeUncontrolled: false,
    type: 'window'
  }
  clients.matchAll(options).then(clientList => {
    for (let i = 0; i < clientList.length; i++) {
      // Might do more communications or checks to make sure the message is
      // posted to the correct window only.

      // Copy the relevant data from the paymentrequestevent to
      // send to the payment app confirmation page.
      // Note that the entire PaymentRequestEvent can not be passed through
      // postMessage directly since it can not be cloned.
      clientList[i].postMessage(paymentRequestEvent.total)
    }
  })
} */

function PromiseResolver () {
  /** @private {function(T=): void} */
  this.resolve_

  /** @private {function(*=): void} */
  this.reject_

  /** @private {!Promise<T>} */
  this.promise_ = new Promise((resolve, reject) => {
    this.resolve_ = resolve
    this.reject_ = reject
  })
}

PromiseResolver.prototype = {
  /** @return {!Promise<T>} */
  get promise () {
    return this.promise_
  },

  /** @return {function(T=): void} */
  get resolve () {
    return this.resolve_
  },

  /** @return {function(*=): void} */
  get reject () {
    return this.reject_
  }
}
