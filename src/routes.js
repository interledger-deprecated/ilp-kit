import React from 'react'
import {Router, IndexRoute, Route} from 'react-router'
import { isLoaded as isAuthLoaded, load } from 'redux/actions/auth'
import {
    App,
    Auth,
    Home,
    Button,
    Settings,
    NotFound,
    Widget
  } from 'containers'

export default (store) => {
  const isAuth = () => {
    return store.getState().auth.user
  }

  const loadAuth = (cb) => {
    if (!isAuthLoaded(store.getState())) {
      store.dispatch(load()).then(cb).catch(cb)
    } else {
      cb()
    }
  }

  const noAuth = (nextState, replace, cb) => {
    loadAuth(() => {
      if (isAuth()) replace('/')
      cb()
    })
  }

  const requireAuth = (nextState, replace, cb) => {
    loadAuth(() => {
      if (!isAuth()) replace('/')
      cb()
    })
  }

  const rootComponent = (nextState, cb) => {
    loadAuth(() => {
      cb(null, isAuth() ? Home : Auth)
    })
  }

  /**
   * Please keep routes in alphabetical order
   */
  return (
    <Router>
      <Route path="widget" component={Widget} />
      <Route path="/" component={App}>
        { /* Home (main) route */ }
        <IndexRoute getComponent={rootComponent}/>

        { /* Routes only available to guests */ }
        <Route onEnter={noAuth}>
          <Route path="login" component={Auth}/>
          <Route path="register" component={Auth}/>
          <Route path="forgot-password" component={Auth}/>
          <Route path="change-password/:username/:passwordChangeCode" component={Auth}/>
        </Route>

        { /* Routes requiring Auth */ }
        <Route onEnter={requireAuth}>
          <Route path="button" component={Button}/>
          <Route path="settings" component={Settings}/>
        </Route>

        { /* Routes available to all */ }
        <Route path="verify/:username/:verifyCode" getComponent={rootComponent}/>

        { /* Catch all route */ }
        <Route path="*" component={NotFound} status={404} />
      </Route>
    </Router>
  )
}
