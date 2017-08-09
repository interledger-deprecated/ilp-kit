import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'

// Middleware
import createClientMiddleware from './middleware/clientMiddleware'
// import { loadingBarMiddleware } from 'react-redux-loading-bar'
import { routerMiddleware } from 'react-router-redux'

import reducers from './reducers'

export default function createFinalStore (client, history) {
  const middleware = [
    routerMiddleware(history),
    createClientMiddleware(client),
    // loadingBarMiddleware({ promiseTypeSuffixes: ['PENDING', 'SUCCESS', 'FAIL'] })
  ]

  return createStore(reducers, composeWithDevTools(applyMiddleware(...middleware)))
}
