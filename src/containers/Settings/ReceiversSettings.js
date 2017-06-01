import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { load, update, remove } from 'redux/actions/receiver'

import ReceiverAddForm from './ReceiverAddForm'

@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    receivers: state.receiver.receivers
  }),
  { load, update, remove })
export default class ReceiversSettings extends Component {
  static propTypes = {
    // Auth
    user: PropTypes.object,
    config: PropTypes.object,
    receivers: PropTypes.array,
    load: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired
  }

  componentWillMount () {
    this.props.load()
  }

  handleRemove = (receiver) => (e) => {
    e.preventDefault()

    // TODO:UX Show an are you sure message
    this.props.remove(receiver.name)
  }

  render () {
    const { user, config, receivers } = this.props

    if (!user) return null

    return (
      <div className='panel panel-default'>
        <div className='panel-heading'>
          <div className='panel-title'>Edit Receivers</div>
        </div>
        <div className='panel-body'>
          <span className='help-block'>Receivers allow you to create webhooks to receive payments in your server-based apps.</span>
          <ReceiverAddForm />
        </div>
        <ul className='list-group'>
          <li className='list-group-item'>
            <h4 className='list-group-item-heading'>{user.username}@{config.clientHost} (default)</h4>
            <span>The default receiver is always enabled and does not support webhooks.</span>
          </li>
          {receivers.map((receiver, index) => (
            <li key={index} className='list-group-item'>
              <h4 className='list-group-item-heading'>{user.username}+{receiver.name}@{config.clientHost}</h4>
              <p><strong>Webhook</strong><br />{receiver.webhook}</p>
              <p><strong>Destination Account</strong><br />{receiver.destination_account}</p>
              <p><strong>Shared Secret</strong><br />{receiver.shared_secret}</p>
              <button type='button' className='btn btn-danger' onClick={this.handleRemove(receiver)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}
