import React from 'react';
import {Router, IndexRoute, Route} from 'react-router';
import { isLoaded as isAuthLoaded, load as loadAuth } from 'redux/modules/auth';
import {
    App,
    Home,
    Send,
    Login,
    LoginSuccess,
    Register,
    NotFound,
    Widget
  } from 'containers';

export default (store) => {
  const requireLogin = (nextState, replaceState, cb) => {
    function checkAuth() {
      const { auth: { user }} = store.getState();
      if (!user) {
        // oops, not logged in, so can't be here!
        replaceState(null, '/');
      }
      cb();
    }

    if (!isAuthLoaded(store.getState())) {
      store.dispatch(loadAuth()).then(checkAuth);
    } else {
      checkAuth();
    }
  };

  /**
   * Please keep routes in alphabetical order
   */
  return (
    <Router>
      <Route path="widget" component={Widget} />
      <Route path="/" component={App}>
        { /* Home (main) route */ }
        <IndexRoute component={Home}/>

        { /* Routes requiring login */ }
        <Route onEnter={requireLogin}>
          <Route path="loginSuccess" component={LoginSuccess}/>
        </Route>

        { /* Routes */ }
        <Route path="login" component={Login}/>
        <Route path="register" component={Register}/>
        <Route path="send" component={Send}/>

        { /* Catch all route */ }
        <Route path="*" component={NotFound} status={404} />
      </Route>
    </Router>
  );
};
