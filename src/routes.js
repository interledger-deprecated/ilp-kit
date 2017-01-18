import React from 'react'
import {Router, IndexRoute, Route} from 'react-router'
import { isLoaded as isAuthLoaded, load, locationUpdate } from 'redux/actions/auth'
import App from 'containers/App/App'
import NotFound from 'containers/NotFound/NotFound'
import Widget from 'containers/Widget/Widget'
import Contact from 'containers/Contact/Contact'
import Withdraw from 'containers/Withdraw/Withdraw'

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

  const requireAdmin = (nextState, replace, cb) => {
    loadAuth(() => {
      if (!isAuth() || !isAuth().isAdmin) replace('/')
      cb()
    })
  }

  const getHome = (nextState, cb) => {
    require.ensure(['./containers/Home/Home'], (require) => {
      cb(null, require('./containers/Home/Home'))

      store.dispatch(locationUpdate())
    }, 'home')
  }

  const getAuth = (nextState, cb) => {
    require.ensure(['./containers/Auth/Auth'], (require) => {
      cb(null, require('./containers/Auth/Auth'))

      store.dispatch(locationUpdate())
    }, 'auth')
  }

  const rootComponent = (nextState, cb) => {
    loadAuth(() => isAuth() ? getHome(null, cb) : getAuth(null, cb))
  }

  const getButton = (nextState, cb) => {
    require.ensure(['./containers/Button/Button'], (require) => {
      cb(null, require('./containers/Button/Button'))

      store.dispatch(locationUpdate())
    }, 'button')
  }

  const getSettings = (nextState, cb) => {
    require.ensure(['./containers/Settings/Settings'], (require) => {
      cb(null, require('./containers/Settings/Settings'))

      store.dispatch(locationUpdate())
    }, 'settings')
  }

  const getInvites = (nextState, cb) => {
    require.ensure(['./containers/Invites/Invites'], (require) => {
      cb(null, require('./containers/Invites/Invites'))

      store.dispatch(locationUpdate())
    }, 'invites')
  }

  const getUsers = (nextState, cb) => {
    require.ensure(['./containers/Users/Users'], (require) => {
      cb(null, require('./containers/Users/Users'))

      store.dispatch(locationUpdate())
    }, 'invites')
  }

  const getPeers = (nextState, cb) => {
    require.ensure(['./containers/Peers/Peers'], (require) => {
      cb(null, require('./containers/Peers/Peers'))

      store.dispatch(locationUpdate())
    }, 'invites')
  }


const getContact  = (nextState, cb) => {
    require.ensure(['./containers/Contact/Contact'], (require) => {
      cb(null, require('./containers/Contact/Contact'))

      store.dispatch(locationUpdate())
    }, 'withdraw')
  }

  const getWithdraw  = (nextState, cb) => {
    require.ensure(['./containers/Withdraw/Withdraw'], (require) => {
      cb(null, require('./containers/Withdraw/Withdraw'))

      store.dispatch(locationUpdate())
    }, 'withdraw')
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
          <Route path="login" getComponent={getAuth}/>
          <Route path="register(/:inviteCode)" getComponent={getAuth}/>
          <Route path="forgot-password" getComponent={getAuth}/>
          <Route path="change-password/:username/:passwordChangeCode" getComponent={getAuth}/>
        </Route>

        { /* Routes requiring Auth */ }
        <Route onEnter={requireAuth}>
          <Route path="button" getComponent={getButton}/>
          <Route path="settings" getComponent={getSettings}/>
	  <Route path="withdraw" getComponent={getWithdraw}/>
 	  <Route path="contact" getComponent={getContact}/>
        </Route>

        { /* Admin pages */ }
        <Route onEnter={requireAdmin}>
          <Route path="invites" getComponent={getInvites}/>
          <Route path="users" getComponent={getUsers}/>
          <Route path="peers" getComponent={getPeers}/>
        </Route>

        { /* Routes available to all */ }
        <Route path="verify/:username/:verifyCode" getComponent={rootComponent}/>

        { /* Catch all route */ }
        <Route path="*" component={NotFound} status={404} />
      </Route>
    </Router>
  )
}
