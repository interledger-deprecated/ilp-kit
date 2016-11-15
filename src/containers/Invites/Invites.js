import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'

import { loadCodes } from 'redux/actions/invite'
import InviteCreateForm from 'containers/InviteCreateForm/InviteCreateForm'

import classNames from 'classnames/bind'
import styles from './Invites.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    codes: state.invite.codes
  }),
  {loadCodes})
export default class Invites extends Component {
  static propTypes = {
    codes: PropTypes.array,
    loadCodes: PropTypes.func
  }

  componentWillMount() {
    this.props.loadCodes()
  }

  componentDidMount() {
    const Clipboard = require('clipboard')
    new Clipboard('.copy')
  }

  renderCode(code) {
    return (
      <div className="panel panel-default" key={code.code}>
        <div className="panel-body">
          <div className={cx('row')}>
            <div className={cx('col-sm-6')}>
              <span className={cx('lbl')}>Code</span>
              <a href="" onClick={e => {e.preventDefault()}} data-tip="click to copy the link"
                 data-clipboard-text={config.clientUri + '/register/' + code.code}
                 className={cx('code', 'copy')}>{code.code}</a>
            </div>
            {/* TODO:UX add claimed user */}
            {/* TODO:UX delete invite code */}
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Amount</span>
              {code.amount}
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Claimed</span>
              {code.claimed ? 'Yes' : 'No'}
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>User</span>
              {code.user_id && code.User.username}
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { codes } = this.props

    return (
      <div className={cx('Invites')}>
        <div className={cx('row')}>
          {/* List */}
          <div className={cx('col-sm-8')}>
            {codes.map(this.renderCode)}
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

        <ReactTooltip />
      </div>
    )
  }
}
