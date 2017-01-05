import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import ReactPaginate from 'react-paginate'
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

  state = {
    list: []
  }

  // Load the history
  componentDidMount() {
    this.props.getPage(1)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.loadingPage === nextProps.loadingPage) return

    // This whole list thing is just for the ReactCSSTransitionGroup to work properly
    // to not animate on initial load
    this.setState({
      list: []
    })
  }

  componentDidUpdate() {
    if (this.state.list === this.props.history) return

    this.setState({
      list: this.props.history
    })

    window.scrollTo(0, 0)
  }

  handlePageClick = data => {
    this.props.getPage(data.selected + 1)
    tracker.track('History paginate')
  }

  render() {
    const {history, totalPages, loadingPage} = this.props
    const {list} = this.state

    return (
      <div className={cx('container')}>
        <ul className={cx('list')}>
          {list.length > 0 && <ReactCSSTransitionGroup transitionName={{
            appear: cx('enter'),
            appearActive: cx('enter-active'),
            enter: cx('enter'),
            enterActive: cx('enter-active'),
            leave: cx('leave'),
            leaveActive: cx('leave-active')
          }} transitionAppearTimeout={1000} transitionEnterTimeout={1000} transitionLeaveTimeout={50}>
          {list.map(item => (
            <li key={item.time_slot + item.source_identifier + item.destination_identifier + item.message}>
              <HistoryItem item={item} />
            </li>
          ))}
          </ReactCSSTransitionGroup>}

          {!loadingPage && list.length === 0 && <li className={cx('loading')}>No payments to show</li>}
        </ul>

        {history && history.length > 0 &&
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

