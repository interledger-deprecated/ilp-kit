import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import ReactPaginate from 'react-paginate';
import { getPage } from 'redux/actions/history'

import { initActionCreators } from 'redux-pagination'

import HistoryItem from 'components/HistoryItem/HistoryItem'

import classNames from 'classnames/bind'
import styles from './History.scss'
const cx = classNames.bind(styles)

// TODO not sure the component is the best place for this
const paginationActionCreators = initActionCreators({
  limit: 20,
  path: '/payments'
})

@connect(
  state => ({
    history: state.history.list,
    totalPages: state.history.totalPages,
    loadingPage: state.history.loadingPage,
  }),
  {getPage, ...paginationActionCreators})
export default class Home extends Component {
  static propTypes = {
    history: PropTypes.array,
    totalPages: PropTypes.number,
    loadingPage: PropTypes.bool,

    getPage: PropTypes.func
  }

  // Load the history
  componentDidMount() {
    this.props.getPage(1)
  }

  handlePageClick = (data) => {
    this.props.getPage(data.selected + 1)
    tracker.track('History paginate')
  }

  render() {
    const {history, totalPages, loadingPage} = this.props

    return (
      <div className={cx('container')}>
        <ul className={cx('list')}>
          {history && history.length > 0 &&
            <ReactCSSTransitionGroup transitionName={{
              appear: cx('enter'),
              appearActive: cx('enter-active'),
              enter: cx('enter'),
              enterActive: cx('enter-active'),
              leave: cx('leave'),
              leaveActive: cx('leave-active')
            }} transitionAppearTimeout={1000} transitionEnterTimeout={1000} transitionLeaveTimeout={0}>
            {history && history.map(item => {
              return (
                <li key={item.time_slot + item.source_identifier + item.destination_identifier + item.message}>
                  <HistoryItem item={item} />
                </li>
              )
            })}
            </ReactCSSTransitionGroup>
          }

          {loadingPage && <li className={cx('loading')}>Loading...</li>}
          {!loadingPage && (!history || history.length === 0) && <li className={cx('loading')}>No payments to show</li>}
        </ul>

        {history && history.length > 0 &&
        <ReactPaginate
          pageNum={totalPages || 1}
          pageRangeDisplayed={5}
          marginPagesDisplayed={1}
          previousLabel="&laquo;"
          nextLabel="&raquo;"
          clickCallback={this.handlePageClick}
          breakLabel={<span>...</span>}
          containerClassName="pagination"
          activeClassName="active"
        />}
      </div>
    )
  }
}

