import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import io from 'socket.io-client'
import Tracker from './tracker'

import createFinalStore from './redux/store'
import ApiClient from './helpers/ApiClient'

import App from 'containers/App/App'
import registerServiceWorker from './registerServiceWorker'

document.socket = io('', {path: '/api/socket.io'})
document.tracker = new Tracker()

ReactDOM.render(
  <Provider store={createFinalStore(new ApiClient())}>
    <App />
  </Provider>,
  document.getElementById('root'))

registerServiceWorker()
