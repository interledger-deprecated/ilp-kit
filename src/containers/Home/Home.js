import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import * as authActions from 'redux/actions/auth'
import { amount } from '../../utils/amount'

import { SendForm } from 'containers'
import { LoginForm } from 'components'
import { RegisterForm } from 'components'
import { History } from 'containers'

import classNames from 'classnames/bind'
import styles from './Home.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    authFail: state.auth.fail,
    activeTab: state.auth.activeTab
  }),
  authActions)
export default class Home extends Component {
  static propTypes = {
    user: PropTypes.object,
    authFail: PropTypes.object,
    login: PropTypes.func,
    register: PropTypes.func,
    unmount: PropTypes.func,
    reload: PropTypes.func,
    changeTab: PropTypes.func,
    activeTab: PropTypes.string
  }

  static contextTypes = {
    config: PropTypes.object
  }

  reload = () => {
    this.props.reload({username: this.props.user.username})
  }

  handleDefaultPayment = () => {
    navigator.registerPaymentHandler('interledger', location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/widget')
  }

  handleChangeTab = (tab, event) => {
    event.preventDefault()
    this.props.changeTab(tab)
  }

  render() {
    const {user, authFail, unmount, login, register, activeTab} = this.props
    const {config} = this.context

    return (
      <div>
        {!user &&
        <div className="row">
          <div className="col-xs-12 col-sm-offset-4 col-sm-4">
            <div className={cx('panel', 'panel-transparent', 'panel-auth')}>
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="collapse">
                <li className={activeTab === 'login' ? 'active' : ''}>
                  <a href="" onClick={this.handleChangeTab.bind(this, 'login')} data-toggle="tab" role="tab" aria-expanded="true">
                    Login
                  </a>
                </li>
                <li className={activeTab === 'register' ? 'active' : ''}>
                  <a href="" onClick={this.handleChangeTab.bind(this, 'register')} data-toggle="tab" role="tab" aria-expanded="true">
                    Register
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active">
                  {activeTab === 'login' &&
                  <LoginForm login={login} fail={authFail} unmount={unmount} />}
                  {activeTab === 'register' &&
                  <RegisterForm register={register} fail={authFail} unmount={unmount} />}
                </div>
              </div>
            </div>
          </div>
        </div>}

        {/* Balance Send widget */}
        {user &&
        <div>
          <div className="row">
            <div className="col-sm-8">
              {/* Balance */}
              <div className="panel panel-default">
                <div className="panel-body">
                  <div className={cx('balanceContainer')}>
                    <div className={cx('balanceDescription')}>Your Balance</div>
                    <div className={cx('balance')}>
                      {config.currencySymbol}{amount(user.balance)}
                      {config.reload && <span className={cx('but')}>*</span>}
                    </div>
                    {config.reload &&
                      <div>
                        <button className="btn btn-complete btn-lg" onClick={this.reload}>Get More</button>
                        <div className={cx('balanceFake')}>* Don't get too excited, this is fake money</div>
                      </div>}
                  </div>
                </div>
              </div>
              {/* History */}
              <div className="panel panel-default">
                <div className="panel-heading">
                  <div className="panel-title">Payment History</div>
                </div>
                <div className="panel-body">
                  <History />
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <div className="panel-title">Use Five Bells Wallet as your default payment provider</div>
                </div>
                <div className="panel-body">
                  <button className="btn btn-complete btn-block" onClick={this.handleDefaultPayment}>Set as default</button>
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <div className="panel-title">Send Money</div>
                </div>
                <div className="panel-body">
                  <SendForm />
                </div>
              </div>
            </div>
          </div>
        </div>}
      </div>
    )
  }
}
