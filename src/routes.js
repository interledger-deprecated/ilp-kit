import React from 'react'
import { Router, IndexRoute, Route } from 'react-router'
import { isLoaded as isAuthLoaded, load, locationUpdate } from 'redux/actions/auth'
import App from 'containers/App/App'
import NotFound from 'containers/NotFound/NotFound'
import Widget from 'containers/Widget/Widget'

export default (store) => {
  const isAuth = () => {
    return store.getState().auth.user
  }

  let authLoadPromise

  const loadAuth = (cb) => {
    if (!isAuthLoaded(store.getState()) && !authLoadPromise) {
      authLoadPromise = store.dispatch(load())
    }

    if (authLoadPromise) {
      authLoadPromise.then(() => {
        authLoadPromise = undefined
        cb()
      }).catch(() => {
        authLoadPromise = undefined
        cb()
      })
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
    require.ensure(['./containers/Home/Home'], require => {
      cb(null, require('./containers/Home/Home'))

      store.dispatch(locationUpdate())
    }, 'home')
  }

  const getAuth = (nextState, cb) => {
    require.ensure(['./containers/Auth/Auth'], require => {
      cb(null, require('./containers/Auth/Auth'))

      store.dispatch(locationUpdate())
    }, 'auth')
  }

  const rootComponent = (nextState, cb) => {
    loadAuth(() => isAuth() ? getHome(null, cb) : getAuth(null, cb))
  }

  const getButton = (nextState, cb) => {
    require.ensure(['./containers/Button/Button'], require => {
      cb(null, require('./containers/Button/Button'))

      store.dispatch(locationUpdate())
    }, 'button')
  }

  const getSettings = (nextState, cb) => {
    require.ensure(['./containers/Settings/Settings'], require => {
      cb(null, require('./containers/Settings/Settings'))

      store.dispatch(locationUpdate())
    }, 'settings')
  }

  const getSend = (nextState, cb) => {
    require.ensure(['./containers/Send/Send'], require => {
      cb(null, require('./containers/Send/Send'))

      store.dispatch(locationUpdate())
    }, 'send')
  }

  const getInvites = (nextState, cb) => {
    require.ensure(['./containers/Invites/Invites'], require => {
      cb(null, require('./containers/Invites/Invites'))

      store.dispatch(locationUpdate())
    }, 'invites')
  }

  const getUsers = (nextState, cb) => {
    require.ensure(['./containers/Users/Users'], require => {
      cb(null, require('./containers/Users/Users'))

      store.dispatch(locationUpdate())
    }, 'users')
  }

  const getWithdrawals = (nextState, cb) => {
    require.ensure(['./containers/Withdrawals/Withdrawals'], require => {
      cb(null, require('./containers/Withdrawals/Withdrawals'))

      store.dispatch(locationUpdate())
    }, 'withdrawals')
  }

  const getPeers = (nextState, cb) => {
    require.ensure(['./containers/Peers/Peers'], require => {
      cb(null, require('./containers/Peers/Peers'))

      store.dispatch(locationUpdate())
    }, 'peers')
  }

  const getSettlementSettings = (nextState, cb) => {
    require.ensure(['./containers/SettlementSettings/SettlementSettings'], require => {
      cb(null, require('./containers/SettlementSettings/SettlementSettings'))

      store.dispatch(locationUpdate())
    }, 'settlementSettings')
  }

  const getSettlementsUser = (nextState, cb) => {
    require.ensure(['./containers/SettlementsUser/SettlementsUser'], require => {
      cb(null, require('./containers/SettlementsUser/SettlementsUser'))

      store.dispatch(locationUpdate())
    }, 'settlementsUser')
  }

  const getSettlementsPeer = (nextState, cb) => {
    require.ensure(['./containers/SettlementsPeer/SettlementsPeer'], require => {
      cb(null, require('./containers/SettlementsPeer/SettlementsPeer'))

      store.dispatch(locationUpdate())
    }, 'settlementsPeer')
  }

  const getSettle = (nextState, cb) => {
    require.ensure(['./containers/Settle/Settle'], require => {
      cb(null, require('./containers/Settle/Settle'))

      store.dispatch(locationUpdate())
    }, 'settle')
  }

  const getSettlementInfo = (nextState, cb) => {
    require.ensure(['./containers/SettlementInfo/SettlementInfo'], require => {
      cb(null, require('./containers/SettlementInfo/SettlementInfo'))

      store.dispatch(locationUpdate())
    }, 'settlementInfo')
  }

  const getSettlementCancel = (nextState, cb) => {
    require.ensure(['./containers/SettlementCancel/SettlementCancel'], require => {
      cb(null, require('./containers/SettlementCancel/SettlementCancel'))

      store.dispatch(locationUpdate())
    }, 'settlementCancel')
  }

  const getWithdraw = (nextState, cb) => {
    require.ensure(['./containers/Withdraw/Withdraw'], require => {
      cb(null, require('./containers/Withdraw/Withdraw'))

      store.dispatch(locationUpdate())
    }, 'withdraw')
  }

  /**
   * Please keep routes in alphabetical order
   */
  return (
    <Router>
      <Route path='widget' component={Widget} />
      <Route path='/' component={App}>
        { /* Home (main) route */ }
        <IndexRoute getComponent={rootComponent} />

        { /* Routes only available to guests */ }
        <Route onEnter={noAuth}>
          <Route path='login' getComponent={getAuth} />
          <Route path='register(/:inviteCode)' getComponent={getAuth} />
          <Route path='forgot-password' getComponent={getAuth} />
          <Route path='change-password/:username/:passwordChangeCode' getComponent={getAuth} />
        </Route>

        { /* Routes requiring Auth */ }
        <Route onEnter={requireAuth}>
          <Route path='button' getComponent={getButton} />
          <Route path='settings' getComponent={getSettings} />
          <Route path='send' getComponent={getSend} />
        </Route>

        { /* Admin pages */ }
        <Route onEnter={requireAdmin}>
          <Route path='invites' getComponent={getInvites} />
          <Route path='users' getComponent={getUsers} />
          <Route path='withdrawals' getComponent={getWithdrawals} />
          <Route path='peers' getComponent={getPeers} />
          <Route path='settlements'>
            <Route path='user' getComponent={getSettlementsUser} />
            <Route path='peer' getComponent={getSettlementsPeer} />
            <Route path='settings' getComponent={getSettlementSettings} />
          </Route>
        </Route>

        { /* Routes available to all */ }
        <Route path='settle/:method/:destination' getComponent={getSettle} />
        <Route path='settlement/cancel' getComponent={getSettlementCancel} />
        <Route path='settlement/:id' getComponent={getSettlementInfo} />
        <Route path='withdraw' getComponent={getWithdraw} />
        <Route path='verify/:username/:verifyCode' getComponent={rootComponent} />

        { /* Catch all route */ }
        <Route path='*' component={NotFound} status={404} />
      </Route>
    </Router>
  )
}
