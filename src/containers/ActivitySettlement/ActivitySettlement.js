import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import moment from 'moment'
import TimeAgo from 'react-timeago'
import _ from 'lodash'

import { destinationChange, amountsChange } from 'redux/actions/send'

import Amount from 'components/Amount/Amount'

import classNames from 'classnames/bind'
import styles from './ActivitySettlement.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    user: state.auth.user,
    config: state.auth.config,
    advancedMode: state.auth.advancedMode
  }), { destinationChange, amountsChange })
export default class ActivitySettlement extends Component {
  static propTypes = {
    activity: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    config: PropTypes.object,
    advancedMode: PropTypes.bool,
    destinationChange: PropTypes.func.isRequired,
    amountsChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    config: {}
  }

  state = {
    showTransfers: false
  }

  componentWillMount() {
    this.processActivity()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.activity === nextProps.activity) return

    this.processActivity(nextProps)
  }

  processActivity = (props = this.props) => {
    const settlement = props.activity.Settlements[0]

    this.setState({
      ...this.state,
      settlement
    })
  }

  toggleTransfers = event => {
    this.setState({
      ...this.state,
      showTransfers: !this.state.showTransfers
    })

    event.preventDefault()
  }

  handleCounterpartyClick = e => {
    e.preventDefault()

    this.props.destinationChange(this.state.payment.counterpartyIdentifier)
  }

  handleAmountClick = e => {
    e.preventDefault()

    this.props.amountsChange(this.state.type === 'outgoing' ? this.state.payment.source_amount : this.state.payment.destination_amount, null)
  }

  timeAgoFormatter = (value, unit, suffix) => {
    if (unit !== 'second') {
      return [value, unit + (value !== 1 ? 's' : ''), suffix].join(' ')
    }

    if (suffix === 'ago') {
      return 'a few seconds ago'
    }

    if (suffix === 'from now') {
      return 'in a few seconds'
    }
  }

  render() {
    const { config } = this.props
    const { settlement } = this.state
    const advancedMode = this.props.advancedMode

    // TODO payments grouping / message
    return (
      <div className={cx('ActivitySettlement')}>
        <div className="row">
          <div className="col-xs-8">
            <i className={cx('fa', 'fa-plus', 'icon')} />
            <div className={cx('description')}>
              {/* TODO:UX include the deposit method */}
              Deposit
            </div>
          </div>
          <div className="col-xs-4">
            <div className={cx('amount')}>
              <Amount amount={settlement.amount} currencySymbol={config.currencySymbol} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
