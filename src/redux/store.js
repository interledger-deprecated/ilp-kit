import { createStore as _createStore, applyMiddleware, compose } from 'redux'
import createMiddleware from './middleware/clientMiddleware'
import { syncHistory } from 'react-router-redux'
import { loadingBarMiddleware } from 'react-redux-loading-bar'

export default function createStore (history, client, data) {
  // Sync dispatched route actions to the history
  const reduxRouterMiddleware = syncHistory(history)

  const middleware = [createMiddleware(client), reduxRouterMiddleware]

  // Leave the __CLIENT__ check until below issue is resolved
  // https://github.com/mironov/react-redux-loading-bar/issues/30
  if (__CLIENT__) {
    middleware.push(loadingBarMiddleware({
      promiseTypeSuffixes: ['PENDING', 'SUCCESS', 'FAIL']
    }))
  }

  let finalCreateStore
  if (__DEVELOPMENT__ && __CLIENT__ && __DEVTOOLS__) {
    const { persistState } = require('redux-devtools')
    const DevTools = require('../containers/DevTools/DevTools')
    finalCreateStore = compose(
      applyMiddleware(...middleware),
      window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument(),
      persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
    )(_createStore)
  } else {
    finalCreateStore = applyMiddleware(...middleware)(_createStore)
  }

  const reducer = require('./reducer')
  const store = finalCreateStore(reducer, data)

  reduxRouterMiddleware.listenForReplays(store)

  if (__DEVELOPMENT__ && module.hot) {
    module.hot.accept('./reducer', () => {
      store.replaceReducer(require('./reducer'))
    })
  }

  return store
}
