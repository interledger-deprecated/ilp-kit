import React, { Component } from 'react'
import { Route } from 'react-router-dom'

import Home from 'containers/Home/Home'
import Auth from 'containers/Auth/Auth'
import Button from 'containers/Button/Button'
import Settings from 'containers/Settings/Settings'
import Send from 'containers/Send/Send'
import Invites from 'containers/Invites/Invites'
import Users from 'containers/Users/Users'
import Withdrawals from 'containers/Withdrawals/Withdrawals'
import Peers from 'containers/Peers/Peers'
import SettlementsUser from 'containers/SettlementsUser/SettlementsUser'
import SettlementsPeer from 'containers/SettlementsPeer/SettlementsPeer'
import SettlementSettings from 'containers/SettlementSettings/SettlementSettings'
import Settle from 'containers/Settle/Settle'
import SettlementCancel from 'containers/SettlementCancel/SettlementCancel'
import SettlementInfo from 'containers/SettlementInfo/SettlementInfo'
import Withdraw from 'containers/Withdraw/Withdraw'
import Pay from 'containers/Pay/Pay'
import WebPayment from 'containers/WebPayment/WebPayment'
import Widget from 'containers/Widget/Widget'
import NotFound from 'containers/NotFound/NotFound'

class Routes extends Component {
  render() {
    return (
      <div>
        { /* Home (main) route */ }
        <Route component={Home} />

        { /* Routes only available to guests */ }
        {/*<Route onEnter={noAuth}>*/}
          <Route path='login' component={Auth} />
          <Route path='register(/:inviteCode)' component={Auth} />
          <Route path='forgot-password' component={Auth} />
          <Route path='change-password/:username/:passwordChangeCode' component={Auth} />
        {/*</Route>*/}

        { /* Routes requiring Auth */ }
        {/*<Route onEnter={requireAuth}>*/}
          <Route path='button' component={Button} />
          <Route path='settings' component={Settings} />
          <Route path='send' component={Send} />
        {/*</Route>*/}

        { /* Admin pages */ }
        {/*<Route onEnter={requireAdmin}>*/}
          <Route path='invites' component={Invites} />
          <Route path='users' component={Users} />
          <Route path='withdrawals' component={Withdrawals} />
          <Route path='peers' component={Peers} />
          <Route path='settlements'>
            <Route path='user' component={SettlementsUser} />
            <Route path='peer' component={SettlementsPeer} />
            <Route path='settings' component={SettlementSettings} />
          </Route>
        {/*</Route>*/}

        { /* Routes available to all */ }
        <Route path='settle/:method/:destination' component={Settle} />
        <Route path='settlement/cancel' component={SettlementCancel} />
        <Route path='settlement/:id' component={SettlementInfo} />
        <Route path='withdraw' component={Withdraw} />
        <Route path='verify/:username/:verifyCode' component={Home} />
        <Route path='pay(/:username)' component={Pay} />
        <Route path='webpayment/:destination/:amount' component={WebPayment} />

        { /* Catch all route */ }
        <Route path='*' component={NotFound} status={404} />
      </div>
    )
  }
}

export default Routes
