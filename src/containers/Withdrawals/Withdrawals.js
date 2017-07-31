import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'

import AnimateEnterLeave from 'components/AnimateEnterLeave/AnimateEnterLeave'

import { load, update } from 'redux/actions/withdrawal'
import List from 'components/List/List'

import classNames from 'classnames/bind'
import styles from './Withdrawals.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    withdrawalState: state.withdrawal,
    loaded: state.invite.loaded
  }),
  { load, update })
export default class Withdrawals extends Component {
  static propTypes = {
    withdrawalState: PropTypes.object,
    update: PropTypes.func.isRequired,
    load: PropTypes.func.isRequired,
    loaded: PropTypes.bool
  }

  state = {}

  componentWillMount () {
    if (!this.props.loaded) {
      this.props.load()
    }
  }

  handleComplete = id => () => {
    this.props.update(id, { status: 'complete' })
  }

  renderWithdrawal = withdrawal => {
    return (
      <div className={cx('withdrawal')} key={withdrawal.id}>
        <div className={cx('row', 'row-sm')}>
          <div className={cx('col-sm-5')}>
            {withdrawal.User.username}
          </div>
          <div className={cx('col-sm-3', 'amountColumn')}>
            <span className={cx('amount')}>{withdrawal.amount}</span>
          </div>
          <div className={cx('col-sm-2', 'status')}>
            {withdrawal.status}
          </div>
          <div className={cx('col-sm-2', 'text-right')}>
            {withdrawal.status !== 'complete' &&
            <button className={cx('btn', 'btn-success')} onClick={this.handleComplete(withdrawal.id)}>Complete</button>}
          </div>
        </div>

        <ReactTooltip />
      </div>
    )
  }

  render () {
    const { withdrawalState } = this.props

    return (
      <div className={cx('Invites')}>
        <Helmet>
          <title>Withdrawals</title>
        </Helmet>

        {withdrawalState.list.length > 0 &&
        <div className={cx('row', 'row-sm', 'tableHead')}>
          <div className={cx('col-sm-5')}>
            User
          </div>
          <div className={cx('col-sm-3', 'amountColumn')}>
            Amount
          </div>
          <div className={cx('col-sm-2')}>
            Status
          </div>
        </div>}

        <List
          emptyScreen={(
            <div className={cx('panel', 'panel-default', 'status')}>
              <div className='panel-body'>
                <i className={cx('fa', 'fa-ticket')} />
                <h1>No Withdrawals</h1>
              </div>
            </div>
          )} state={withdrawalState}>
          {withdrawalState.list.length > 0 &&
          <AnimateEnterLeave>
            {withdrawalState.list.map(this.renderWithdrawal)}
          </AnimateEnterLeave>}
        </List>
      </div>
    )
  }
}
