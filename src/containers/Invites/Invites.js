import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import Helmet from 'react-helmet'

import { loadCodes, remove } from 'redux/actions/invite'
import List from 'components/List/List'
import InviteCreateForm from 'containers/InviteCreateForm/InviteCreateForm'

import classNames from 'classnames/bind'
import styles from './Invites.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    inviteState: state.invite,
    config: state.auth.config
  }),
  { loadCodes, remove })
export default class Invites extends Component {
  static propTypes = {
    inviteState: PropTypes.object,
    loadCodes: PropTypes.func,
    config: PropTypes.object
  }

  componentWillMount() {
    this.props.loadCodes()
  }

  componentDidMount() {
    const Clipboard = require('clipboard')
    new Clipboard('.copy')
  }

  handleRemove = (code, e) => {
    e.preventDefault()

    this.props.remove(code)
  }

  renderCode = (invite) => {
    const config = this.props.config

    return (
      <div className={cx('panel', 'panel-default', 'invite')} key={invite.code}>
        <div className="panel-body">
          <div className={cx('row')}>
            <div className={cx('col-sm-6')}>
              <span className={cx('lbl')}>Code</span>
              <a href="" onClick={e => {e.preventDefault()}} data-tip="click to copy the link"
                 data-clipboard-text={config.clientUri + '/register/' + invite.code}
                 className={cx('code', 'copy')}>{invite.code}</a>
            </div>
            <div className={cx('col-sm-4', 'amountColumn')}>
              <span className={cx('lbl')}>Amount</span>
              <span className={cx('amount')}>{invite.amount}</span>
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Claimed</span>
              {!invite.claimed && <span className={cx('claimed')}>No</span>}

              {invite.user_id && <strong>{invite.User.username}</strong>}
            </div>
          </div>
        </div>

        {/* TODO:UX ask for confirmation */}
        {/* TODO:UX shouldn't be able to delete already claimed ones */}
        <a href="" className={cx('deleteButton')} onClick={this.handleRemove.bind(null, invite.code)}>
          <i className="fa fa-times" />
        </a>

        <ReactTooltip />
      </div>
    )
  }

  render() {
    const { inviteState } = this.props

    return (
      <div className={cx('Invites')}>
        <Helmet title={'Invites'} />

        <div className={cx('row')}>
          <div className={cx('col-sm-8')}>
            <List
              loadingScreen={(
                <div className={cx('panel', 'panel-default', 'invitesStatus')}>
                  <div className="panel-body">
                    <i className={cx('fa', 'fa-ticket')} />
                    <h1>Loading Invite Codes...</h1>
                  </div>
                </div>
              )}
              emptyScreen={(
                <div className={cx('panel', 'panel-default', 'invitesStatus')}>
                  <div className="panel-body">
                    <i className={cx('fa', 'fa-ticket')} />
                    <h1>No Invite Codes</h1>
                    <div>Use the form on the right to add invite codes</div>
                  </div>
                </div>
              )} state={inviteState}>
              {inviteState.list.map(this.renderCode)}
            </List>
          </div>

          {/* Create new */}
          <div className={cx('col-sm-4')}>
            <div className="panel panel-default">
              <div className="panel-heading">
                <div className="panel-title">Generate an Invite Code</div>
              </div>
              <div className="panel-body">
                <InviteCreateForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
