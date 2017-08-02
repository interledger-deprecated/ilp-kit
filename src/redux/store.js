import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'
import createHistory from 'history/createBrowserHistory'

// Middleware
import createClientMiddleware from './middleware/clientMiddleware'
import { loadingBarMiddleware } from 'react-redux-loading-bar'
import { routerMiddleware } from 'react-router-redux'

import reducers from './reducers'

const history = createHistory()

export default function createFinalStore (client) {
  const middleware = [
    routerMiddleware(history),
    createClientMiddleware(client),
    loadingBarMiddleware({ promiseTypeSuffixes: ['PENDING', 'SUCCESS', 'FAIL'] })
  ]

  return createStore(reducers, composeWithDevTools(applyMiddleware(...middleware)))
}
