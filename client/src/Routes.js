import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'
import { withRouter } from 'react-router'
import { load } from 'redux/actions/auth'

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
import NotFound from 'containers/NotFound/NotFound'

@connect(
  state => ({
    loaded: state.auth.loaded,
    user: state.auth.user,
    isAdmin: state.auth.isAdmin
  }),
  { load })
class Routes extends Component {
  static propTypes = {
    loaded: PropTypes.bool
  }

  componentWillMount() {
    this.props.load()
  }

  GuestRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={props => (this.props.user ? <Redirect to='/' /> : <Component {...props} />)}/>
  )

  UserRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={props => (this.props.user ? <Component {...props} /> : <Redirect to='/' />)}/>
  )

  AdminRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={props => ((this.props.user && this.props.user.isAdmin) ? <Component {...props} /> : <Redirect to='/' />)}/>
  )

  render() {
    const { GuestRoute, UserRoute, AdminRoute } = this

    // Wait before the auth is loaded to avoid flickering
    if (!this.props.loaded) return null

    return (
      <Switch>
        { /* Home (main) page */ }
        <Route path='/' exact component={this.props.user ? Home : Auth} />

        { /* Pages only available to guests */ }
        <GuestRoute path='/login' component={Auth} />
        <GuestRoute path='/register(/:inviteCode)' component={Auth} />
        <GuestRoute path='/forgot-password' component={Auth} />
        <GuestRoute path='/change-password/:username/:passwordChangeCode' component={Auth} />

        { /* User pages */ }
        <UserRoute path='/button' component={Button} />
        <UserRoute path='/settings' component={Settings} />
        <UserRoute path='/send' component={Send} />

        { /* Admin pages */ }
        <AdminRoute path='/invites' component={Invites} />
        <AdminRoute path='/users' component={Users} />
        <AdminRoute path='/withdrawals' component={Withdrawals} />
        <AdminRoute path='/peers' component={Peers} />
        <AdminRoute path='/settlements/user' component={SettlementsUser} />
        <AdminRoute path='/settlements/peer' component={SettlementsPeer} />
        <AdminRoute path='/settlements/settings' component={SettlementSettings} />

        { /* Routes available to all */ }
        <Route path='/settle/:method/:destination' component={Settle} />
        <Route path='/settlement/cancel' component={SettlementCancel} />
        <Route path='/settlement/:id' component={SettlementInfo} />
        <Route path='/withdraw' component={Withdraw} />
        <Route path='/verify/:username/:verifyCode' component={Home} />
        <Route path='/pay(/:username)' component={Pay} />
        <Route path='/webpayment/:destination/:amount' component={WebPayment} />

        { /* Catch all route */ }
        <Route component={NotFound} />
      </Switch>
    )
  }
}

export default withRouter(Routes)
