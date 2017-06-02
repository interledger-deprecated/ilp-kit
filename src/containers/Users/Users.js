import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import Helmet from 'react-helmet'

import { loadUsers } from 'redux/actions/user'

import classNames from 'classnames/bind'
import styles from './Users.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    users: state.user.users,
    loaded: state.user.loaded
  }),
  { loadUsers })
export default class Invites extends Component {
  static propTypes = {
    loadUsers: PropTypes.func,
    users: PropTypes.array,
    loaded: PropTypes.bool
  }

  componentWillMount () {
    if (!this.props.loaded) {
      this.props.loadUsers()
    }
  }

  renderProfilePic = (cell, row) => {
    return <img
      src={cell ? `/api/users/${row.username}/profilepic` : require('../../../static/placeholder.png')}
      className={cx('profilePic')} />
  }

  render () {
    const { users } = this.props

    return (
      <div className={cx('Users')}>
        <Helmet>
          <title>Users</title>
        </Helmet>

        <div className={cx('header')}>
          <h3>Users</h3>
        </div>

        {/* TODO:UX add search attribute */}
        <BootstrapTable
          data={users}
          bordered={false}
          pagination
          ignoreSinglePage
          trClassName={cx('tr')}
          tableHeaderClass={cx('header')}
        >
          <TableHeaderColumn dataField='profile_picture' dataFormat={this.renderProfilePic} width='66px' />
          <TableHeaderColumn dataField='username' isKey dataSort>Username</TableHeaderColumn>
          <TableHeaderColumn dataField='name' dataSort>Name</TableHeaderColumn>
          <TableHeaderColumn dataField='balance' dataSort>Balance</TableHeaderColumn>
          <TableHeaderColumn dataField='email' dataSort>Email</TableHeaderColumn>
          <TableHeaderColumn dataField='email_verified' dataSort>Email Verified</TableHeaderColumn>
        </BootstrapTable>
      </div>
    )
  }
}
