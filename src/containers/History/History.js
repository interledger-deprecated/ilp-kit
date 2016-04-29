import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import ReactPaginate from 'react-paginate';
import * as historyActions from 'redux/actions/history'

import { initActionCreators } from 'redux-pagination'

import { HistoryItem } from 'components'

import classNames from 'classnames/bind'
import styles from './History.scss'
const cx = classNames.bind(styles)

// TODO not sure the component is the best place for this
const paginationActionCreators = initActionCreators({
  limit: 10,
  path: '/payments'
})

@connect(
  state => ({
    history: state.history.list,
    totalPages: state.history.totalPages,
    loadingPage: state.history.loadingPage,
    user: state.auth.user
  }),
  {...historyActions, ...paginationActionCreators})
export default class Home extends Component {
  static propTypes = {
    history: PropTypes.array,
    totalPages: PropTypes.number,
    user: PropTypes.object,
    loadingPage: PropTypes.bool,
    toggleJson: PropTypes.func,

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
    const {history, totalPages, user, toggleJson, loadingPage} = this.props

    return (
      <div className={cx('container')}>
        <ul className={cx('list')}>
          {history && history.length > 0 &&
            <ReactCSSTransitionGroup transitionName={{
              enter: cx('enter'),
              enterActive: cx('enter-active'),
              leave: cx('leave'),
              leaveActive: cx('leave-active')
            }} transitionEnterTimeout={1000} transitionLeaveTimeout={300}>
            {history && history.map(item => {
              return (
                <li key={item.id}>
                  <HistoryItem item={item} user={user} toggleJson={toggleJson}/>
                </li>
              )
            })}
            </ReactCSSTransitionGroup>
          }

          {loadingPage && <li className={cx('loading')}>Loading...</li>}
          {!loadingPage && (!history || history.length === 0) && <li className={cx('loading')}>No payments to show</li>}
        </ul>

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
        />
      </div>
    )
  }
}

