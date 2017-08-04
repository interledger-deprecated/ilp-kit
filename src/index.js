import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import io from 'socket.io-client'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter } from 'react-router-redux'
import Tracker from './tracker'

import createFinalStore from './redux/store'
import ApiClient from './helpers/ApiClient'

import Routes from 'Routes'

import registerServiceWorker from './registerServiceWorker'

document.socket = io('', {path: '/api/socket.io'})
document.tracker = new Tracker()

const history = createHistory()

ReactDOM.render(
  <Provider store={createFinalStore(new ApiClient())}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'))

registerServiceWorker()
