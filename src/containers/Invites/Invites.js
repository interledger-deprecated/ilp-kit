import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'
import { HotKeys } from 'react-hotkeys'

import ButtonDanger from 'components/ButtonDanger/ButtonDanger'
import AnimateEnterLeave from 'components/AnimateEnterLeave/AnimateEnterLeave'

import { loadCodes, remove } from 'redux/actions/invite'
import List from 'components/List/List'
import InviteCreateForm from 'containers/InviteCreateForm/InviteCreateForm'

import classNames from 'classnames/bind'
import styles from './Invites.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    inviteState: state.invite,
    config: state.auth.config,
    loaded: state.invite.loaded
  }),
  { loadCodes, remove })
export default class Invites extends Component {
  static propTypes = {
    inviteState: PropTypes.object,
    loadCodes: PropTypes.func,
    config: PropTypes.object,
    loaded: PropTypes.bool,
    remove: PropTypes.func
  }

  state = {}

  componentWillMount () {
    if (!this.props.loaded) {
      this.props.loadCodes()
    }
  }

  componentDidMount () {
    const Clipboard = require('clipboard')
    // You should use "new" for side effects, but this instance is out of our
    // control
    // eslint-disable-next-line no-new
    new Clipboard('.copy')
  }

  handleToggleAddForm = () => {
    this.setState({
      ...this.state,
      showAddForm: !this.state.showAddForm
    })
  }

  handleRemove = code => e => {
    e.preventDefault()

    this.props.remove(code)
  }

  renderCode = (invite) => {
    const config = this.props.config

    return (
      <div className={cx('invite')} key={invite.code}>
        <div className={cx('row', 'row-sm')}>
          <div className={cx('col-sm-5')}>
            <a href='' onClick={e => { e.preventDefault() }} data-tip='click to copy the link'
              data-clipboard-text={config.clientUri + '/register/' + invite.code}
              className={cx('code', 'copy')}>{invite.code}</a>
          </div>
          <div className={cx('col-sm-3', 'amountColumn')}>
            <span className={cx('amount')}>{invite.amount}</span>
          </div>
          <div className={cx('col-sm-2')}>
            {!invite.claimed && <span className={cx('claimed')}>No</span>}

            {invite.user_id && <strong>{invite.User.username}</strong>}
          </div>
          <div className={cx('col-sm-2', 'text-right')}>
            {/* TODO:UX shouldn't be able to delete already claimed ones */}
            <ButtonDanger
              initialText='x'
              confirmationText='sure?'
              onConfirm={this.handleRemove(invite.code)}
              id={invite.code}
              className={cx('btn-delete')} />
          </div>
        </div>

        <ReactTooltip />
      </div>
    )
  }

  render () {
    const { inviteState } = this.props
    const { showAddForm } = this.state

    return (
      <div className={cx('Invites')}>
        <Helmet>
          <title>Invites</title>
        </Helmet>

        {/* Add new */}
        {!showAddForm && inviteState.list.length > 0 &&
        <div className={cx('header', 'row', 'row-sm')}>
          <div className={cx('col-sm-10')}>
            <h3>Invite Codes</h3>
          </div>
          <div className={cx('col-sm-2')}>
            <button type='button' className={cx('btn', 'btn-success', 'btn-block')} onClick={this.handleToggleAddForm}>Add Invite Code</button>
          </div>
        </div>}

        {showAddForm &&
        <HotKeys handlers={{ esc: this.handleToggleAddForm }}>
          <InviteCreateForm />
        </HotKeys>}

        {inviteState.list.length > 0 &&
        <div className={cx('row', 'row-sm', 'tableHead')}>
          <div className={cx('col-sm-5')}>
            Code
          </div>
          <div className={cx('col-sm-3', 'amountColumn')}>
            Amount
          </div>
          <div className={cx('col-sm-2')}>
            Claimed
          </div>
        </div>}

        <List
          emptyScreen={(
            <div className={cx('panel', 'panel-default', 'invitesStatus')}>
              <div className='panel-body'>
                <i className={cx('fa', 'fa-ticket')} />
                <h1>No Invite Codes</h1>
                {!showAddForm &&
                <div>
                  <div>Click the button below to add your first invite code.</div>
                  <button type='button'
                    onClick={this.handleToggleAddForm}
                    className={cx('btn', 'btn-success', 'btn-lg', 'btn-add-lg')}>
                    Add Invite Code
                  </button>
                </div>}
              </div>
            </div>
          )} state={inviteState}>
          {inviteState.list.length > 0 &&
          <AnimateEnterLeave>
            {inviteState.list.map(this.renderCode)}
          </AnimateEnterLeave>}
        </List>
      </div>
    )
  }
}
