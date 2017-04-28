import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import { CSSTransitionGroup } from 'react-transition-group'
import ReactPaginate from 'react-paginate'
import { getPage } from 'redux/actions/activity'

import { initActionCreators } from 'redux-pagination'

import ActivityPayment from 'containers/ActivityPayment/ActivityPayment'
import ActivitySettlement from 'containers/ActivitySettlement/ActivitySettlement'
import ActivityWithdrawal from 'containers/ActivityWithdrawal/ActivityWithdrawal'

import classNames from 'classnames/bind'
import styles from './Activity.scss'
const cx = classNames.bind(styles)

// TODO not sure the component is the best place for this
const paginationActionCreators = initActionCreators({
  limit: 20,
  path: '/activity_logs'
})

@connect(
  state => ({
    activity: state.activity.list,
    totalPages: state.activity.totalPages,
    loadingPage: state.activity.loadingPage,
    initialLoad: state.activity.initialLoad
  }),
  {getPage, ...paginationActionCreators})
export default class Home extends Component {
  static propTypes = {
    activity: PropTypes.array,
    totalPages: PropTypes.number,
    loadingPage: PropTypes.bool,
    initialLoad: PropTypes.bool,

    getPage: PropTypes.func
  }

  state = {
    list: []
  }

  // Load the activity
  componentWillMount() {
    if (!this.props.initialLoad) {
      this.props.getPage(1)
    }

    if (this.props.activity.length) {
      this.setState({
        list: this.props.activity
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.loadingPage === nextProps.loadingPage) return

    // This whole list thing is just for the CSSTransitionGroup to work properly
    // to not animate on initial load
    this.setState({
      list: []
    })
  }

  componentDidUpdate() {
    if (this.state.list === this.props.activity) return

    this.setState({
      list: this.props.activity
    })

    window.scrollTo(0, 0)
  }

  handlePageClick = data => {
    this.props.getPage(data.selected + 1)
    tracker.track('Activity paginate')
  }

  render() {
    const {activity, totalPages, loadingPage, initialLoad} = this.props
    const {list} = this.state

    return (
      <div className={cx('container')}>
        <ul className={cx('list')}>
          {list.length > 0 && <CSSTransitionGroup transitionName={{
            appear: cx('enter'),
            appearActive: cx('enter-active'),
            enter: cx('enter'),
            enterActive: cx('enter-active'),
            leave: cx('leave'),
            leaveActive: cx('leave-active')
          }} transitionAppearTimeout={1000} transitionEnterTimeout={1000} transitionLeaveTimeout={50}>
          {list.map(activity => (
            <li key={activity.id}>
              {activity.Payments.length > 0 &&
              <ActivityPayment activity={activity} />}

              {activity.Settlements.length > 0 &&
              <ActivitySettlement activity={activity} />}

              {activity.Withdrawals.length > 0 &&
              <ActivityWithdrawal activity={activity} />}
            </li>
          ))}
          </CSSTransitionGroup>}

          {initialLoad && list.length === 0 && <li className={cx('loading')}>No payments to show</li>}
        </ul>

        {activity && activity.length > 0 &&
          <div className={cx('pagination')}>
            <ReactPaginate
              pageCount={totalPages || 1}
              pageRangeDisplayed={5}
              marginPagesDisplayed={1}
              previousLabel="&laquo;"
              nextLabel="&raquo;"
              onPageChange={this.handlePageClick}
              breakLabel={<span>...</span>}
              containerClassName="pagination"
              activeClassName="active"
            />
            {loadingPage && <span className={cx('loading')}>Loading...</span>}
          </div>}
      </div>
    )
  }
}
