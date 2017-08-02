import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import createFinalStore from './redux/store'
import ApiClient from './helpers/ApiClient'

import App from './containers/App/App'
import registerServiceWorker from './registerServiceWorker'

const client = new ApiClient()

ReactDOM.render(
  <Provider store={createFinalStore(client)}>
    <App />
  </Provider>,
  document.getElementById('root'))

registerServiceWorker()
