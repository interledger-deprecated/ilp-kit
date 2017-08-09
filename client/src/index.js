/* globals global */

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import io from 'socket.io-client'
import createHistory from 'history/createBrowserHistory'
import { Route } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import Tracker from './tracker'

import createFinalStore from './redux/store'
import ApiClient from './helpers/ApiClient'

import App from 'containers/App/App'

import registerServiceWorker from './registerServiceWorker'

global.socket = io('', {path: '/api/socket.io'})
global.tracker = new Tracker()

const history = createHistory()

ReactDOM.render(
  <Provider store={createFinalStore(new ApiClient(), history)}>
    <ConnectedRouter history={history}>
      <Route path='/' component={App} />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'))

registerServiceWorker()
