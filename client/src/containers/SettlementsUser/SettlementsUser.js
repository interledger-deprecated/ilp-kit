import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'

import AnimateEnterLeave from 'components/AnimateEnterLeave/AnimateEnterLeave'

import { getSettlements } from 'redux/actions/settlement'
import List from 'components/List/List'

import classNames from 'classnames/bind'
import styles from './SettlementsUser.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    settlementState: state.settlement.user,
    loaded: state.settlement.user.loaded
  }),
  { getSettlements })
export default class SettlementsUser extends Component {
  static propTypes = {
    settlementState: PropTypes.object,
    getSettlements: PropTypes.func.isRequired,
    loaded: PropTypes.bool
  }

  state = {}

  componentWillMount () {
    if (!this.props.loaded) {
      this.props.getSettlements('user')
    }
  }

  renderSettlement = settlement => {
    return (
      <div className={cx('settlement')} key={settlement.id}>
        <div className={cx('row', 'row-sm')}>
          <div className={cx('col-sm-5')}>
            {settlement.User.username}
          </div>
          <div className={cx('col-sm-5', 'amountColumn')}>
            <span className={cx('amount')}>{settlement.amount}</span>
          </div>
          <div className={cx('col-sm-2', 'methodColumn')}>
            {settlement.SettlementMethod.name}
          </div>
        </div>

        <ReactTooltip />
      </div>
    )
  }

  render () {
    const { settlementState } = this.props

    return (
      <div className={cx('Invites')}>
        <Helmet>
          <title>Settlements</title>
        </Helmet>

        {settlementState.list.length > 0 &&
        <div className={cx('row', 'row-sm', 'tableHead')}>
          <div className={cx('col-sm-5')}>
            User
          </div>
          <div className={cx('col-sm-5', 'amountColumn')}>
            Amount
          </div>
          <div className={cx('col-sm-2', 'methodColumn')}>
            Method
          </div>
        </div>}

        <List
          emptyScreen={(
            <div className={cx('panel', 'panel-default', 'status')}>
              <div className='panel-body'>
                <i className={cx('fa', 'fa-ticket')} />
                <h1>No User Settlements</h1>
              </div>
            </div>
          )} state={settlementState}>
          {settlementState.list.length > 0 &&
          <AnimateEnterLeave>
            {settlementState.list.map(this.renderSettlement)}
          </AnimateEnterLeave>}
        </List>
      </div>
    )
  }
}
